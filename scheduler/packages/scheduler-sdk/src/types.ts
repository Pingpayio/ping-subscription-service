import { z } from "zod";

/**
 * Job schedule types
 */
export enum ScheduleType {
  CRON = "cron",
  SPECIFIC_TIME = "specific_time",
  RECURRING = "recurring",
}

/**
 * Job types
 */
export enum JobType {
  HTTP = "http",
}

/**
 * Interval types for recurring jobs
 */
export enum IntervalType {
  MINUTE = "minute",
  HOUR = "hour",
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

/**
 * Job status types
 */
export enum JobStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  FAILED = "failed",
}

export const JobSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(JobType),
  target: z.string().url("Target must be a valid URL"),
  payload: z.record(z.any()).optional(),
  schedule_type: z.nativeEnum(ScheduleType),
  cron_expression: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        val.trim() !== "" ||
        val.split(" ").length === 5 ||
        val.split(" ").length === 6,
      { message: "Invalid cron expression format" },
    ),
  specific_time: z.string().datetime().optional(),
  interval: z.nativeEnum(IntervalType).optional(),
  interval_value: z.number().int().positive().optional(),
  status: z.nativeEnum(JobStatus).default(JobStatus.ACTIVE),
});

/**
 * Type for job input from API
 */
export type JobInput = z.infer<typeof JobSchema>;

/**
 * Type for job stored in database
 */
export interface Job extends JobInput {
  id: string;
  created_at: Date;
  updated_at: Date;
  last_run?: Date;
  next_run?: Date;
  error_message?: string;
}

/**
 * Type for job data stored in BullMQ
 */
export interface JobData {
  jobId: string;
  target: string;
  type: JobType;
  payload?: Record<string, any>;
}

/**
 * API response types
 */

/**
 * Job creation response
 */
export interface JobCreationResponse {
  message: string;
  job: Job;
}

/**
 * Job update response
 */
export interface JobUpdateResponse {
  message: string;
  job: Job;
}

/**
 * Job deletion response
 */
export interface JobDeletionResponse {
  message: string;
  id: string;
}

/**
 * Job list response
 */
export interface JobListResponse {
  jobs: Job[];
}

/**
 * Job list query parameters
 */
export interface JobListParams {
  status?: JobStatus;
}
