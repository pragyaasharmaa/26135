const axios = require("axios");
const logger = require("../logger");

const BASE_URL = "http://20.207.122.201/evaluation-service";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFneWEuMjYxMzVAZ2duaW5kaWEuZHJvbmFjaGFyeWEuaW5mbyIsImV4cCI6MTc3Nzg3NTY5MCwiaWF0IjoxNzc3ODc0NzkwLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZWM4Y2Q0OTctNTI0Zi00ZGZkLTg0ODEtM2MzOGY5ZTFkNWMwIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhZ3lhIHNoYXJtYSIsInN1YiI6ImYyNDY5ODQxLTUxZGQtNDQ5Ny05ODA1LTljMzFmYzI0OGZlZiJ9LCJlbWFpbCI6InByYWd5YS4yNjEzNUBnZ25pbmRpYS5kcm9uYWNoYXJ5YS5pbmZvIiwibmFtZSI6InByYWd5YSBzaGFybWEiLCJyb2xsTm8iOiIyNjEzNSIsImFjY2Vzc0NvZGUiOiJ1a3NkV1QiLCJjbGllbnRJRCI6ImYyNDY5ODQxLTUxZGQtNDQ5Ny05ODA1LTljMzFmYzI0OGZlZiIsImNsaWVudFNlY3JldCI6IlJUemN2ZWJjTndteWRYWGsifQ.cRPXEURn_I5uvtRjKGozuyhzYxhQMnELlamQQNjpT1c";

const headers = { Authorization: `Bearer ${TOKEN}` };

function knapsack(tasks, capacity) {
  const n = tasks.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const { Duration, Impact } = tasks[i - 1];
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (Duration <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - Duration] + Impact);
      }
    }
  }

  let w = capacity;
  const selected = [];
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(tasks[i - 1]);
      w -= tasks[i - 1].Duration;
    }
  }

  return { maxImpact: dp[n][capacity], selectedTasks: selected };
}

async function main() {
  try {
    logger.info("Fetching depots...");
    const depotsRes = await axios.get(`${BASE_URL}/depots`, { headers });
    const depots = depotsRes.data.depots;
    logger.info("Depots fetched", { count: depots.length });

    logger.info("Fetching vehicles...");
    const vehiclesRes = await axios.get(`${BASE_URL}/vehicles`, { headers });
    const vehicles = vehiclesRes.data.vehicles;
    logger.info("Vehicles fetched", { count: vehicles.length });

    const results = [];

    for (const depot of depots) {
      logger.info(`Processing depot ${depot.ID}`);
      const { maxImpact, selectedTasks } = knapsack(vehicles, depot.MechanicHours);

      const result = {
        depotID: depot.ID,
        mechanicHoursBudget: depot.MechanicHours,
        maxImpactScore: maxImpact,
        totalTasksSelected: selectedTasks.length,
        totalHoursUsed: selectedTasks.reduce((s, t) => s + t.Duration, 0),
        selectedTasks: selectedTasks.map((t) => ({
          TaskID: t.TaskID,
          Duration: t.Duration,
          Impact: t.Impact,
        })),
      };

      results.push(result);
      logger.info(`Depot ${depot.ID} done`, result);
    }

    console.log("\n===== FINAL RESULTS =====");
    console.log(JSON.stringify(results, null, 2));
    logger.info("All done!");

  } catch (err) {
    logger.error("Failed", { message: err.message });
    console.error("ERROR:", err.message);
  }
}

main();