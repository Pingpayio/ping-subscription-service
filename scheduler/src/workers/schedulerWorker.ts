/**
 * Scheduler worker implementation
 *
 * This module implements the BullMQ worker for processing scheduled jobs.
 */
import { Worker } from "bullmq";
import axios from "axios";
import { URL } from "url";
import db from "../db/index.js";
import { ACTIVE_QUEUE_NAME, DLQ_QUEUE_NAME } from "../queues/index.js";
import { JobType, JobStatus } from "../types/job.js";
import { calculateNextRun, formatDate } from "../lib/scheduler.js";
import { 
  configureAxiosRetry, 
  categorizeError, 
  truncateErrorLog, 
  ErrorCategory,
  createRetryFunction,
  isRetryableError
} from "../lib/errorHandler.js";
import { 
  validateAndSanitizePayload, 
  HttpPayload 
} from "../types/payload.js";
import {
  httpConfig,
  retryConfig,
  workerConfig,
  loggingConfig
} from "../config/worker.js";

// Configure axios with retry functionality
configureAxiosRetry(axios);

// Parse ALLOWED_TARGET_HOSTS from environment variable
const allowedTargetHosts = (process.env.ALLOWED_TARGET_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

// Validate target URL
function validateTargetUrl(target: string): boolean {
  try {
    const url = new URL(target);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(url.protocol)) {
      console.error(
        `Invalid protocol ${url.protocol} for target URL ${target}`,
      );
      return false;
    }
    
    // Special check for localhost - provide a helpful error message
    // This is especially important in containerized environments
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      console.error(
        `Target URL ${target} uses localhost. If running in a container, this will not work as expected. ` +
        `Use the container name or service name instead.`
      );
      // We don't return false here to allow it to continue if allowedTargetHosts permits it
    }

    // If allowedTargetHosts is empty, allow all hosts
    if (allowedTargetHosts.length === 0) {
      return true;
    }

    // Check if the hostname is in the allowed list
    const isAllowed = allowedTargetHosts.some((allowedHost) => {
      // Support wildcard subdomains (e.g., *.example.com)
      if (allowedHost.startsWith("*.")) {
        const domain = allowedHost.slice(2);
        return url.hostname === domain || url.hostname.endsWith("." + domain);
      }
      return url.hostname === allowedHost;
    });

    if (!isAllowed) {
      console.error(`Target host ${url.hostname} is not in the allowed list`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Invalid target URL ${target}:`, error);
    return false;
  }
}

/**
 * Initialize the BullMQ worker for active jobs
 */
export const activeWorker = new Worker(
  ACTIVE_QUEUE_NAME,
  async (job) => {
    const { jobId, target, type, payload } = job.data;

    console.log(`Running job ${jobId} of type ${type}`);

    try {
      // Get the job from the database to check its status and get the latest configuration
      const jobQuery = "SELECT * FROM jobs WHERE id = $1";
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
        console.log(`Validating target URL ${target}`);

        // Validate the target URL before making the request
        if (!validateTargetUrl(target)) {
          throw new Error(`Invalid or unauthorized target URL: ${target}`);
        }

        console.log(`Validating payload for job ${jobId}`);
        
        // Check payload size
        const payloadString = JSON.stringify(payload || {});
        if (payloadString.length > httpConfig.maxPayloadSize) {
          throw new Error(`Payload size exceeds maximum allowed size of ${httpConfig.maxPayloadSize} bytes`);
        }
        
        // Validate and sanitize the payload
        const validatedPayload: HttpPayload = payload 
          ? validateAndSanitizePayload(payload)
          : {};
          
        console.log(`Making HTTP request to ${target}`);

        // Make the HTTP request with retry functionality
        const response = await createRetryFunction(
          async () => {
            return axios.post(target, validatedPayload, {
              headers: {
                "Content-Type": "application/json",
                "User-Agent": httpConfig.userAgent,
              },
              timeout: httpConfig.timeout,
              maxRedirects: httpConfig.maxRedirects, // Limit redirects to prevent redirect-based attacks
              validateStatus: (status) => status >= 200 && status < 300, // Only accept 2xx status codes
            });
          },
          {
            retries: retryConfig.maxRetries,
            minTimeout: retryConfig.minTimeout,
            maxTimeout: retryConfig.maxTimeout,
            onRetry: (error, attempt) => {
              console.log(`Retry attempt ${attempt} for job ${jobId} to ${target} after error: ${error.message}`);
            }
          }
        );

        console.log(`HTTP request completed with status ${response.status}`);
      } else {
        throw new Error(`Unsupported job type: ${type}`);
      }

      // Calculate the next run time for recurring jobs
      let nextRun: Date | null = null;
      if (dbJob.schedule_type !== "specific_time") {
        nextRun = calculateNextRun(
          {
            schedule_type: dbJob.schedule_type,
            cron_expression: dbJob.cron_expression,
            interval: dbJob.interval,
            interval_value: dbJob.interval_value,
            specific_time: dbJob.specific_time,
          },
          new Date(),
        );
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
        nextRun ? formatDate(nextRun) : null,
      ]);

      console.log(`Job ${jobId} completed successfully`);
    } catch (error) {
      // Categorize the error for better handling
      const category = categorizeError(error as Error);
      
      // Log a truncated version of the error to prevent excessive logging
      console.error(
        `Error running job ${jobId} (${category}):`, 
        truncateErrorLog(error, loggingConfig.maxErrorLogLength)
      );

      // Determine if we should mark the job as failed or keep it active for retry
      let errorMessage = (error as Error).message || "Unknown error";
      
      // For network or timeout errors, we might want to keep the job active
      // for future retry rather than marking it as failed immediately
      let jobStatus;
      if (isRetryableError(error as Error)) {
        console.log(`Retryable error for job ${jobId}, keeping job active for retry`);
        // Enhance error message to indicate it's a temporary failure
        errorMessage = `Temporary failure: ${errorMessage}. The job will be retried.`;
        jobStatus = JobStatus.ACTIVE; // Keep the job active for retry
      } else {
        console.log(`Non-retryable error for job ${jobId}, marking as failed`);
        jobStatus = JobStatus.FAILED;
      }

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
        errorMessage,
        jobStatus,
      ]);

      // Re-throw the error to trigger the BullMQ retry mechanism
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    concurrency: workerConfig.concurrency,
    removeOnComplete: workerConfig.removeOnComplete,
    removeOnFail: workerConfig.removeOnFail,
  },
);

// Log worker events
activeWorker.on("error", (error) => {
  console.error("Worker error:", error);
});

activeWorker.on("failed", (job, error) => {
  // Use truncated error logging to prevent excessive logs
  console.error(`Job ${job?.id} failed with error:`, truncateErrorLog(error, loggingConfig.maxErrorLogLength));
});

activeWorker.on("completed", (job) => {
  console.log(`Job ${job?.id} completed successfully`);
});

/**
 * Initialize a worker to monitor the DLQ
 * This worker doesn't process jobs but is needed to listen to events
 */
export const dlqMonitor = new Worker(
  DLQ_QUEUE_NAME,
  async (job) => {
    // DLQ jobs are not automatically processed
    // They require manual intervention through the dashboard
    console.log(`DLQ job ${job.id} received but not processed automatically`);
    return;
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    concurrency: 1, // Low concurrency as we're not actually processing
    autorun: false, // Don't auto-run jobs in the DLQ
  }
);

dlqMonitor.on("error", (error) => {
  console.error("DLQ monitor error:", error);
});

// Export both workers
export default {
  activeWorker,
  dlqMonitor
};
