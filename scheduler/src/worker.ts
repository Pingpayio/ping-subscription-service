/**
 * Main entry point for the scheduler worker
 */
import dotenv from "dotenv";
import worker from "./workers/schedulerWorker.js";

// Load environment variables
dotenv.config();

console.log("Starting scheduler worker...");

// The worker is already initialized in the imported module
// Just need to make sure it stays running

// Handle process termination
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing worker...");
  await worker.close();
  process.exit(0);
});

// Log that the worker is running
console.log("Scheduler worker is running");
