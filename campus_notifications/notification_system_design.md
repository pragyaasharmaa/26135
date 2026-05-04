# Stage 1

## REST API Design for Campus Notification Platform

### Core Actions
- Fetch all notifications for a student
- Mark a notification as read
- Mark all notifications as read
- Get unread notification count
- Receive real-time notifications via WebSocket

---

### 1. Get All Notifications
**GET** `/api/notifications`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "Placement",
      "message": "Google hiring",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ]
}
```

---

### 2. Mark One Notification as Read
**PATCH** `/api/notifications/:id/read`

**Headers:**
```json
{ "Authorization": "Bearer <token>" }
```

**Response:**
```json
{ "success": true, "message": "Notification marked as read" }
```

---

### 3. Mark All as Read
**PATCH** `/api/notifications/read-all`

**Response:**
```json
{ "success": true, "message": "All notifications marked as read" }
```

---

### 4. Get Unread Count
**GET** `/api/notifications/unread-count`

**Response:**
```json
{ "success": true, "unreadCount": 5 }
```

---

### Real-Time Mechanism: WebSockets
We use WebSockets via Socket.io for real-time notifications.
- When a new notification is created, server emits event to student's room
- Frontend listens and displays it instantly
- No repeated polling needed

---

# Stage 2

## Recommended Database: PostgreSQL

### Why PostgreSQL?
- Notifications have clear structure with fixed fields
- We need filtering and sorting by studentID, type, isRead
- SQL indexes work very efficiently here

---

### DB Schema

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM ('Placement', 'Event', 'Result');

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Sample Queries

**Get all notifications for a student:**
```sql
SELECT * FROM notifications
WHERE student_id = '<uuid>'
ORDER BY created_at DESC;
```

**Get unread notifications:**
```sql
SELECT * FROM notifications
WHERE student_id = '<uuid>' AND is_read = FALSE
ORDER BY created_at DESC;
```

**Mark one as read:**
```sql
UPDATE notifications SET is_read = TRUE WHERE id = '<uuid>';
```

**Mark all as read:**
```sql
UPDATE notifications SET is_read = TRUE WHERE student_id = '<uuid>';
```

---

### Problems as Data Grows

| Problem | Solution |
|---|---|
| Slow queries on millions of rows | Add indexes on student_id, is_read, created_at |
| Old notifications slowing DB | Archive old notifications to separate table |
| Too many reads hitting DB | Add Redis cache layer |
| Single DB overloaded | Use read replicas |

---

# Stage 3

## Query Analysis

**Original slow query:**
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

### Is this query accurate?
Yes but SELECT * fetches all columns unnecessarily.

### Why is it slow?
- No index on studentID, isRead, or createdAt
- With 5,000,000 rows a full table scan happens every time
- SELECT * fetches more data than needed

### Improved Query:
```sql
SELECT id, type, message, created_at FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at DESC;
```

### Index to add:
```sql
CREATE INDEX idx_notifications_student_read
ON notifications (student_id, is_read, created_at DESC);
```

After adding this index, lookup becomes O(log n) instead of O(n). Much faster.

### Should we index every column?
NO. The teammate's advice is wrong because:
- Every index takes extra disk space
- Indexes slow down INSERT and UPDATE operations
- Only index columns you actually filter or sort by

---

### Find students who got Placement notification in last 7 days:
```sql
SELECT DISTINCT student_id FROM notifications
WHERE type = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

---

# Stage 4

## Caching Strategy to Reduce DB Load

**Problem:** Every page load queries DB for notifications causing DB overload.

### Solution 1: Redis Cache (Best)
- Check Redis first on every request
- If data found in Redis, return it directly without hitting DB
- If not found, query DB and store result in Redis for 60 seconds
- When new notification arrives, delete that student's cache

**Tradeoff:** Student may see data up to 60 seconds old. Acceptable for notifications.

### Solution 2: Pagination
- Fetch only 20 notifications at a time using LIMIT and OFFSET
- Reduces data transferred per request

**Tradeoff:** Requires frontend changes.

### Solution 3: HTTP Cache Headers
- Use Cache-Control: max-age=30 on API response
- Browser won't re-request for 30 seconds

**Tradeoff:** Simple but not real-time.

### Best Combined Approach:
Redis cache + Pagination + WebSocket push so cache only invalidates when new notification arrives.

---

# Stage 5

## Analysis of notify_all Implementation

### Original pseudocode:
```
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

### Shortcomings:
1. Sequential processing - 50,000 students one by one is very slow
2. No error handling - if email fails at student 200 the loop stops
3. No retry mechanism - failed emails are lost forever
4. 50,000 individual DB inserts is very slow
5. Email and DB are tightly coupled - one failure breaks everything

### What happened when send_email failed for 200 students?
Those 200 students got no email and possibly no DB record either causing data loss.

### Should saving to DB and sending email happen together?
NO. Because:
- DB save should always succeed immediately
- Email can fail and should be retried separately
- Mixing them means a failed email causes a missing DB record

### Redesigned pseudocode:
```
function notify_all(student_ids: array, message: string):

  // Step 1: Save ALL to DB at once using batch insert
  batch_save_to_db(student_ids, message)

  // Step 2: Push real-time notification immediately
  for student_id in student_ids:
    push_to_app(student_id, message)

  // Step 3: Add emails to a queue for async processing
  for student_id in student_ids:
    enqueue({ type: "email", student_id, message })

// Step 4: Worker processes queue with retries
worker:
  job = dequeue()
  try:
    send_email(job.student_id, job.message)
  catch error:
    if attempts < 3:
      retry(job)
    else:
      log_failed_email(job)
```

### Why this is better:
- DB save is instant and reliable using batch insert
- Failed emails are retried automatically up to 3 times
- App push still happens immediately
- No data loss even if email service is down

---

# Stage 6

## Priority Inbox Approach

### Priority Formula:
- Placement = weight 3 (highest)
- Result = weight 2
- Event = weight 1 (lowest)
- Score = type_weight x 1,000,000,000,000 + timestamp in milliseconds
- Higher score = shown first

### Maintaining Top 10 Efficiently as new notifications arrive:
We use a Min-Heap of size 10:
- As each new notification arrives, calculate its score and add to heap
- If heap size exceeds 10, remove the lowest score item
- This gives O(log 10) time per new notification which is effectively constant
- Always gives correct top 10 without sorting all notifications every time

See stage6_priority.js for working implementation.