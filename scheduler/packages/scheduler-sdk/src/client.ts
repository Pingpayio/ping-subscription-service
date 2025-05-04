import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Job,
  JobInput,
  JobCreationResponse,
  JobUpdateResponse,
  JobDeletionResponse,
  JobListResponse,
  JobListParams,
  JobStatus,
} from './types.js';
import {
  ApiError,
  NetworkError,
  JobNotFoundError,
  DuplicateJobError,
} from './errors.js';

/**
 * Configuration options for the Scheduler client
 */
export interface SchedulerClientOptions {
  /**
   * Base URL for the Scheduler API
   * @default 'http://localhost:3000'
   */
  baseUrl?: string;

  /**
   * Timeout for API requests in milliseconds
   * @default 10000 (10 seconds)
   */
  timeout?: number;

  /**
   * Headers to include with every request
   */
  headers?: Record<string, string>;
}

/**
 * Client for interacting with the Scheduler API
 */
export class SchedulerClient {
  private client: AxiosInstance;
  private baseUrl: string;

  /**
   * Create a new Scheduler client
   * @param options Client configuration options
   */
  constructor(options: SchedulerClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: options.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  /**
   * Create a new job
   * @param job Job configuration
   * @returns Created job
   */
  async createJob(job: JobInput): Promise<Job> {
    try {
      const response = await this.client.post<JobCreationResponse>('/jobs', job);
      return response.data.job;
    } catch (error) {
      this.handleError(error, {
        409: (err) => new DuplicateJobError(job.name),
      });
    }
  }

  /**
   * Get a job by ID
   * @param id Job ID
   * @returns Job
   */
  async getJob(id: string): Promise<Job> {
    try {
      const response = await this.client.get<Job>(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, {
        404: (err) => new JobNotFoundError(id),
      });
    }
  }

  /**
   * Update a job
   * @param id Job ID
   * @param job Job configuration
   * @returns Updated job
   */
  async updateJob(id: string, job: Partial<JobInput>): Promise<Job> {
    try {
      const response = await this.client.put<JobUpdateResponse>(`/jobs/${id}`, job);
      return response.data.job;
    } catch (error) {
      this.handleError(error, {
        404: (err) => new JobNotFoundError(id),
      });
    }
  }

  /**
   * Delete a job
   * @param id Job ID
   * @returns Deleted job ID
   */
  async deleteJob(id: string): Promise<string> {
    try {
      const response = await this.client.delete<JobDeletionResponse>(`/jobs/${id}`);
      return response.data.id;
    } catch (error) {
      this.handleError(error, {
        404: (err) => new JobNotFoundError(id),
      });
    }
  }

  /**
   * List jobs with optional filtering
   * @param params Query parameters
   * @returns List of jobs
   */
  async listJobs(params?: JobListParams): Promise<Job[]> {
    try {
      const response = await this.client.get<JobListResponse>('/jobs', {
        params,
      });
      return response.data.jobs;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Find jobs by name
   * @param name Job name to search for
   * @returns List of matching jobs
   */
  async findJobsByName(name: string): Promise<Job[]> {
    const allJobs = await this.listJobs();
    return allJobs.filter(job => job.name === name);
  }

  /**
   * Check if a job with the given name exists
   * @param name Job name to check
   * @returns True if a job with the name exists, false otherwise
   */
  async jobExistsByName(name: string): Promise<boolean> {
    const jobs = await this.findJobsByName(name);
    return jobs.length > 0;
  }

  /**
   * Create a job if it doesn't already exist
   * @param job Job configuration
   * @returns Created job or existing job
   */
  async createJobIfNotExists(job: JobInput): Promise<Job> {
    const existingJobs = await this.findJobsByName(job.name);
    
    if (existingJobs.length > 0) {
      return existingJobs[0];
    }
    
    return this.createJob(job);
  }

  /**
   * List active jobs
   * @returns List of active jobs
   */
  async listActiveJobs(): Promise<Job[]> {
    return this.listJobs({ status: JobStatus.ACTIVE });
  }

  /**
   * List failed jobs
   * @returns List of failed jobs
   */
  async listFailedJobs(): Promise<Job[]> {
    return this.listJobs({ status: JobStatus.FAILED });
  }

  /**
   * List inactive jobs
   * @returns List of inactive jobs
   */
  async listInactiveJobs(): Promise<Job[]> {
    return this.listJobs({ status: JobStatus.INACTIVE });
  }

  /**
   * Handle API errors
   * @param error Error from axios
   * @param statusHandlers Custom handlers for specific status codes
   */
  private handleError(
    error: unknown,
    statusHandlers: Record<number, (error: AxiosError) => Error> = {}
  ): never {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const data = error.response?.data;
      
      // Use custom handler if available for this status code
      if (statusHandlers[statusCode]) {
        throw statusHandlers[statusCode](error);
      }
      
      // Default error handling
      if (statusCode === 404) {
        throw new JobNotFoundError(error.config?.url?.split('/').pop() || 'unknown');
      }
      
      throw new ApiError(
        error.message || `API request failed with status ${statusCode}`,
        statusCode,
        data
      );
    }
    
    // Network or other errors
    throw new NetworkError(
      (error as Error)?.message || 'Network error occurred',
      error as Error
    );
  }
}
