/**
 * Main entry point for the scheduler worker
 */
import dotenv from "dotenv";
import workers from "./workers/schedulerWorker.js";

// Load environment variables
dotenv.config();

console.log("Starting scheduler workers...");

// The worker is already initialized in the imported module
// Just need to make sure it stays running

// Handle process termination
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing workers...");
  await workers.activeWorker.close();
  await workers.dlqMonitor.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing workers...");
  await workers.activeWorker.close();
  await workers.dlqMonitor.close();
  process.exit(0);
});

// Log that the workers are running
console.log("Scheduler workers are running");
