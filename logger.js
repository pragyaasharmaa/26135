const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "app.log");

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...(data && { data }) };
  const logLine = JSON.stringify(logEntry) + "\n";
  fs.appendFileSync(logFile, logLine);
  console.log(logLine.trim());
}

module.exports = {
  info: (msg, data) => log("INFO", msg, data),
  error: (msg, data) => log("ERROR", msg, data),
  warn: (msg, data) => log("WARN", msg, data),
};