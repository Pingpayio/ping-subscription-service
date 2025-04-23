/**
 * Scheduler worker implementation
 * 
 * This module implements the BullMQ worker for processing scheduled jobs.
 */
import { Worker } from 'bullmq';
import axios from 'axios';
import db from '../db/index.js';
import { QUEUE_NAME } from '../queues/index.js';
import { JobType, JobStatus } from '../types/job.js';
import { calculateNextRun, formatDate } from '../lib/scheduler.js';

/**
 * Initialize the BullMQ worker
 */
export const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { jobId, target, type, payload } = job.data;
    
    console.log(`Running job ${jobId} of type ${type}`);
    
    try {
      // Get the job from the database to check its status and get the latest configuration
      const jobQuery = 'SELECT * FROM jobs WHERE id = $1';
      const jobResult = await db.query(jobQuery, [jobId]);
      
      if (jobResult.rows.length === 0) {
        console.warn(`Job ${jobId} not found in database, skipping execution`);
        return;
      }
      
      const dbJob = jobResult.rows[0];
      
      // Skip execution if the job is inactive
      if (dbJob.status === JobStatus.INACTIVE) {
        console.log(`Job ${jobId} is inactive, skipping execution`);
        return;
      }
      
      // Execute the job based on its type
      if (type === JobType.HTTP) {
        console.log(`Making HTTP request to ${target}`);
        
        // Make the HTTP request
        const response = await axios.post(target, payload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PingPay-Scheduler/1.0'
          },
          timeout: 30000 // 30 seconds timeout
        });
        
        console.log(`HTTP request completed with status ${response.status}`);
      } else {
        throw new Error(`Unsupported job type: ${type}`);
      }
      
      // Calculate the next run time for recurring jobs
      let nextRun = null;
      if (dbJob.schedule_type !== 'specific_time') {
        nextRun = calculateNextRun({
          schedule_type: dbJob.schedule_type,
          cron_expression: dbJob.cron_expression,
          interval: dbJob.interval,
          interval_value: dbJob.interval_value,
          specific_time: dbJob.specific_time
        }, new Date());
      }
      
      // Update the job in the database
      const updateQuery = `
        UPDATE jobs
        SET last_run = NOW(),
            next_run = $2,
            error_message = NULL,
            updated_at = NOW()
        WHERE id = $1
      `;
      
      await db.query(updateQuery, [
        jobId,
        nextRun ? formatDate(nextRun) : null
      ]);
      
      console.log(`Job ${jobId} completed successfully`);
    } catch (error) {
      console.error(`Error running job ${jobId}:`, error);
      
      // Update the job in the database with the error message
      const updateQuery = `
        UPDATE jobs
        SET error_message = $2,
            status = $3,
            updated_at = NOW()
        WHERE id = $1
      `;
      
      await db.query(updateQuery, [
        jobId,
        (error as Error).message || 'Unknown error',
        JobStatus.FAILED
      ]);
      
      // Re-throw the error to trigger the retry mechanism
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 5, // Process up to 5 jobs concurrently
    removeOnComplete: { count: 0 }, // Don't keep completed jobs
    removeOnFail: { count: 500 }, // Keep the last 500 failed jobs
  }
);

// Log worker events
worker.on('error', (error) => {
  console.error('Worker error:', error);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed with error:`, error);
});

worker.on('completed', (job) => {
  console.log(`Job ${job?.id} completed successfully`);
});

export default worker;
