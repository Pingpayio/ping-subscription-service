/**
 * Worker configuration
 * 
 * This module provides configuration settings for the scheduler worker.
 */

/**
 * HTTP request configuration
 */
export const httpConfig = {
  /**
   * HTTP request timeout in milliseconds
   */
  timeout: 30000,
  
  /**
   * Maximum number of redirects to follow
   */
  maxRedirects: 5,
  
  /**
   * User agent string for HTTP requests
   */
  userAgent: "PingPay-Scheduler/1.0",
  
  /**
   * Maximum payload size in bytes (1MB)
   */
  maxPayloadSize: 1024 * 1024,
};

/**
 * Retry configuration for HTTP requests
 */
export const retryConfig = {
  /**
   * Maximum number of retries for HTTP requests
   */
  maxRetries: 3,
  
  /**
   * Minimum timeout between retries in milliseconds
   */
  minTimeout: 1000,
  
  /**
   * Maximum timeout between retries in milliseconds
   */
  maxTimeout: 30000,
  
  /**
   * Factor to increase timeout by between retries
   */
  backoffFactor: 2,
};

/**
 * BullMQ worker configuration
 */
export const workerConfig = {
  /**
   * Maximum number of jobs to process concurrently
   */
  concurrency: 5,
  
  /**
   * Number of completed jobs to keep
   */
  removeOnComplete: { count: 0 },
  
  /**
   * Number of failed jobs to keep
   */
  removeOnFail: { count: 500 },
  
  /**
   * Default job options
   */
  defaultJobOptions: {
    /**
     * Number of attempts before marking a job as failed
     */
    attempts: 3,
    
    /**
     * Backoff strategy for retries
     */
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds
    },
  },
};

/**
 * Logging configuration
 */
export const loggingConfig = {
  /**
   * Maximum length of error logs
   */
  maxErrorLogLength: 500,
  
  /**
   * Whether to log detailed error information
   */
  detailedErrors: process.env.NODE_ENV !== 'production',
};
