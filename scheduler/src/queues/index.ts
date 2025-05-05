/**
 * Queue setup module
 *
 * This module initializes the BullMQ queue for job scheduling.
 */
import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

export const ACTIVE_QUEUE_NAME = "scheduler-queue";
export const DLQ_QUEUE_NAME = "scheduler-dlq"; // Dead Letter Queue for inactive/failed jobs

// Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Default job options
const defaultJobOptions = {
  attempts: 3, // Number of retry attempts
  backoff: {
    type: "exponential" as const,
    delay: 1000, // Initial delay in milliseconds (1 second)
  },
  removeOnComplete: true, // Remove jobs after completion
  removeOnFail: 500, // Keep the last 500 failed jobs
};

/**
 * Initialize the BullMQ queues
 */
export const activeQueue = new Queue(ACTIVE_QUEUE_NAME, {
  connection: redisOptions,
  defaultJobOptions,
});

export const dlqQueue = new Queue(DLQ_QUEUE_NAME, {
  connection: redisOptions,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 0, // No automatic retries for DLQ jobs
  },
});

// Log queue events
activeQueue.on('error', (error) => {
  console.error("Active queue error:", error);
});

// Use proper event types for BullMQ
activeQueue.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed with error:`, error);
});

activeQueue.on('completed', (job) => {
  console.log(`Job ${job?.id} completed successfully`);
});

dlqQueue.on('error', (error) => {
  console.error("DLQ error:", error);
});

// Export both queues
export default {
  activeQueue,
  dlqQueue
};
