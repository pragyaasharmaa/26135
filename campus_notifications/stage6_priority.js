const axios = require("axios");
const logger = require("../logger");

const BASE_URL = "http://20.207.122.201/evaluation-service";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFneWEuMjYxMzVAZ2duaW5kaWEuZHJvbmFjaGFyeWEuaW5mbyIsImV4cCI6MTc3Nzg3Njg5MiwiaWF0IjoxNzc3ODc1OTkyLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZDkwZmNlMjAtYmQzOS00ZTMxLTlkNzQtMmJlMWMwN2RlZGJmIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhZ3lhIHNoYXJtYSIsInN1YiI6ImYyNDY5ODQxLTUxZGQtNDQ5Ny05ODA1LTljMzFmYzI0OGZlZiJ9LCJlbWFpbCI6InByYWd5YS4yNjEzNUBnZ25pbmRpYS5kcm9uYWNoYXJ5YS5pbmZvIiwibmFtZSI6InByYWd5YSBzaGFybWEiLCJyb2xsTm8iOiIyNjEzNSIsImFjY2Vzc0NvZGUiOiJ1a3NkV1QiLCJjbGllbnRJRCI6ImYyNDY5ODQxLTUxZGQtNDQ5Ny05ODA1LTljMzFmYzI0OGZlZiIsImNsaWVudFNlY3JldCI6IlJUemN2ZWJjTndteWRYWGsifQ.KcTvM7Y3ydLa67Tsqi92ekemp0QKbz4Xc28RCu-njDY";

const headers = { Authorization: `Bearer ${TOKEN}` };

const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };

function getPriorityScore(notification) {
  const typeWeight = TYPE_WEIGHT[notification.Type] || 0;
  const timestamp = new Date(notification.Timestamp).getTime();
  return typeWeight * 1e12 + timestamp;
}

function getTopN(notifications, n = 10) {
  return notifications
    .map((notif) => ({ ...notif, priorityScore: getPriorityScore(notif) }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, n);
}

async function main() {
  try {
    logger.info("Fetching notifications...");
    const res = await axios.get(`${BASE_URL}/notifications`, { headers });
    const notifications = res.data.notifications;
    logger.info("Notifications fetched", { count: notifications.length });

    const top10 = getTopN(notifications, 10);

    console.log("\n===== TOP 10 PRIORITY NOTIFICATIONS =====");
    top10.forEach((n, i) => {
      console.log(`${i + 1}. [${n.Type}] ${n.Message} | Time: ${n.Timestamp}`);
    });

    logger.info("Top 10 done", { top10 });
  } catch (err) {
    logger.error("Failed", { message: err.message });
    console.error("ERROR:", err.message);
  }
}

main();