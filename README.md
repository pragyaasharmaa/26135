# Affordmed Campus Hiring Evaluation - Backend

**Name:** Pragya Sharma
**Roll No:** 26135
**Email:** pragya.26135@ggnindia.dronacharya.info

---

## Overview
This repository contains my submission for the Affordmed Campus Hiring Backend Evaluation. It includes two major tasks:
1. **Vehicle Maintenance Scheduler** - An optimization microservice
2. **Campus Notifications Microservice** - A full notification system design and implementation

---

## Project Structure

```
affordmed-test/
├── logger.js                          # Logging Middleware (used everywhere)
├── vehicle_scheduling/
│   ├── index.js                       # Vehicle Scheduling Solution
│   └── outPut.png                     # Output Screenshot
└── campus_notifications/
    ├── notification_system_design.md  # Complete Design (Stages 1-6)
    ├── stage6_priority.js             # Priority Inbox Implementation
    └── stage6_output.png              # Output Screenshot
```

---

## Logging Middleware
A custom logging middleware (`logger.js`) is used throughout the entire project. It:
- Logs every API call, success, and error
- Writes logs to `app.log` file with timestamps
- Supports INFO, ERROR, and WARN log levels
- Used in all code files as required

---

## Task 1: Vehicle Maintenance Scheduler

### Problem
Given a list of vehicles requiring maintenance, each with a duration and impact score, and a daily mechanic-hour budget per depot - find the optimal set of tasks to maximise total impact score without exceeding the budget.

### Approach
This is a classic **0/1 Knapsack Problem** solved using **Dynamic Programming**:
- Fetches depot data from the Depot API (mechanic-hour budgets)
- Fetches vehicle/task data from the Vehicles API
- For each depot, runs the knapsack algorithm to find the best combination of tasks
- Outputs the selected tasks and maximum impact score for each depot

### Results
| Depot | Budget (hrs) | Max Impact Score | Tasks Selected |
|-------|-------------|-----------------|----------------|
| 1 | 60 | 151 | 20 |
| 2 | 135 | 212 | 33 |
| 3 | 188 | 226 | 40 |
| 4 | 97 | 187 | 27 |

### How to Run
```
node vehicle_scheduling/index.js
```

---

## Task 2: Campus Notifications Microservice

### Stage 1: REST API Design
Designed a complete REST API for a campus notification platform supporting:
- GET `/api/notifications` - Fetch all notifications
- PATCH `/api/notifications/:id/read` - Mark one as read
- PATCH `/api/notifications/read-all` - Mark all as read
- GET `/api/notifications/unread-count` - Get unread count
- **Real-time notifications via WebSockets (Socket.io)**

### Stage 2: Database Design
- Chose **PostgreSQL** as the database
- Designed normalized schema with `students` and `notifications` tables
- Written SQL queries for all API operations

### Stage 3: Query Optimization
- Analyzed a slow query on 5,000,000 rows
- Identified missing indexes as root cause
- Added composite index on `(student_id, is_read, created_at DESC)`
- Reduced query time from O(n) full scan to O(log n) index lookup
- Explained why indexing every column is a bad idea

### Stage 4: Caching Strategy
- Identified DB overload problem from repeated page loads
- Proposed **Redis caching** as primary solution with 60 second TTL
- Also suggested **Pagination** and **HTTP Cache Headers**
- Explained tradeoffs of each approach

### Stage 5: Bulk Notification Redesign
- Identified problems in the original `notify_all` implementation:
  - Sequential processing of 50,000 students
  - No error handling or retry mechanism
  - DB and email tightly coupled
- Redesigned using:
  - **Batch DB insert** for all 50,000 records at once
  - **Message Queue** for async email processing
  - **Retry mechanism** with max 3 attempts per failed email

### Stage 6: Priority Inbox
Implemented a priority inbox that always shows top 10 most important unread notifications:
- **Priority Formula:** Placement (weight 3) > Result (weight 2) > Event (weight 1)
- Recency used as tiebreaker within same type
- Uses **Min-Heap** approach for efficient top-N retrieval as new notifications arrive
- Fetches live data from the Notifications API

### How to Run
```
node campus_notifications/stage6_priority.js
```

### Sample Output
```
===== TOP 10 PRIORITY NOTIFICATIONS =====
1. [Placement] Marvell Technology Inc. hiring | Time: 2026-05-04 05:56:37
2. [Placement] Amgen Inc. hiring | Time: 2026-05-04 04:56:57
3. [Placement] Apple Inc. hiring | Time: 2026-05-04 02:57:05
4. [Placement] Eli Lilly and Company hiring | Time: 2026-05-04 01:26:25
5. [Placement] Tesla Inc. hiring | Time: 2026-05-03 23:57:09
6. [Placement] Meta Platforms Inc. hiring | Time: 2026-05-03 15:56:49
7. [Placement] Amgen Inc. hiring | Time: 2026-05-03 09:56:29
8. [Placement] Microsoft Corporation hiring | Time: 2026-05-03 08:26:53
9. [Placement] CSX Corporation hiring | Time: 2026-05-03 06:26:45
10. [Result] external | Time: 2026-05-03 23:27:01
```

---

## Technologies Used
- **Runtime:** Node.js
- **HTTP Client:** Axios
- **Algorithm:** Dynamic Programming (0/1 Knapsack)
- **Database (designed):** PostgreSQL
- **Caching (designed):** Redis
- **Real-time (designed):** WebSockets via Socket.io
- **Queue (designed):** Message Queue (Redis Queue / RabbitMQ)