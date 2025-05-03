/**
 * Base error class for all Scheduler SDK errors
 */
export class SchedulerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchedulerError';
    Object.setPrototypeOf(this, SchedulerError.prototype);
  }
}

/**
 * Error thrown when a request to the Scheduler API fails
 */
export class ApiError extends SchedulerError {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Error thrown when a job validation fails
 */
export class ValidationError extends SchedulerError {
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when a job is not found
 */
export class JobNotFoundError extends SchedulerError {
  jobId: string;

  constructor(jobId: string) {
    super(`Job with ID ${jobId} not found`);
    this.name = 'JobNotFoundError';
    this.jobId = jobId;
    Object.setPrototypeOf(this, JobNotFoundError.prototype);
  }
}

/**
 * Error thrown when a duplicate job is detected
 */
export class DuplicateJobError extends SchedulerError {
  jobName: string;

  constructor(jobName: string) {
    super(`Job with name "${jobName}" already exists`);
    this.name = 'DuplicateJobError';
    this.jobName = jobName;
    Object.setPrototypeOf(this, DuplicateJobError.prototype);
  }
}

/**
 * Error thrown when there's a network issue
 */
export class NetworkError extends SchedulerError {
  originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
