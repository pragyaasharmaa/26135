# Affordmed Campus Hiring Evaluation - Backend

**Name:** Pragya Sharma
**Roll No:** 26135

---

## Project Structure
affordmed-test/
├── logger.js                          # Logging Middleware
├── vehicle_scheduling/
│   ├── index.js                       # Vehicle Scheduling Code
│   └── outPut.png                     # Output Screenshot
└── campus_notifications/
├── notification_system_design.md  # Stages 1-6 Design
├── stage6_priority.js             # Priority Inbox Code
└── stage6_output.png              # Output Screenshot

---

## Task 1: Vehicle Maintenance Scheduler
- Fetches depots and vehicles from the API
- Uses **Knapsack Algorithm** to select best tasks within mechanic-hour budget
- Maximises total operational impact score for each depot

## Task 2: Campus Notifications Microservice
- **Stage 1:** REST API design with WebSocket for real-time notifications
- **Stage 2:** PostgreSQL DB schema and queries
- **Stage 3:** Query optimization with indexes
- **Stage 4:** Redis caching strategy to reduce DB load
- **Stage 5:** Redesigned notify_all with message queue and retries
- **Stage 6:** Priority inbox showing top 10 notifications (Placement > Result > Event)

---

## How to Run

### Vehicle Scheduling
node vehicle_scheduling/index.js

### Campus Notifications Stage 6
node campus_notifications/stage6_priority.js
