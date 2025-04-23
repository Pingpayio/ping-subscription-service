/**
 * Queue setup module
 * 
 * This module initializes the BullMQ queue for job scheduling.
 */
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Queue name
export const QUEUE_NAME = 'scheduler-queue';

// Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Default job options
const defaultJobOptions = {
  attempts: 3, // Number of retry attempts
  backoff: {
    type: 'exponential' as const,
    delay: 1000, // Initial delay in milliseconds (1 second)
  },
  removeOnComplete: true, // Remove jobs after completion
  removeOnFail: 500, // Keep the last 500 failed jobs
};

/**
 * Initialize the BullMQ queue
 */
export const queue = new Queue(QUEUE_NAME, {
  connection: redisOptions,
  defaultJobOptions,
});

// Log queue events
queue.on('error', (error) => {
  console.error('Queue error:', error);
});

queue.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed with error:`, error);
});

queue.on('completed', (job) => {
  console.log(`Job ${job?.id} completed successfully`);
});

export default queue;
