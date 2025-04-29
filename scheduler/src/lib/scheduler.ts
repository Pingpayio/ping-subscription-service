/**
 * Scheduler helper functions
 * 
 * This module provides utility functions for calculating job schedules,
 * next run times, and delays.
 */
import { CronExpressionParser } from 'cron-parser';
import { Job, JobInput, ScheduleType, IntervalType } from '../types/job.js';

/**
 * Calculate the initial delay for a job in milliseconds
 * 
 * @param job - The job to calculate the delay for
 * @returns The delay in milliseconds, or null if the job is not a one-time job or the time is invalid
 */
export function calculateInitialDelay(job: JobInput): number | null {
  if (job.schedule_type !== ScheduleType.SPECIFIC_TIME || !job.specific_time) {
    return null;
  }

  const specificTime = new Date(job.specific_time);
  const now = new Date();
  
  // If the specific time is in the past, return null
  if (specificTime.getTime() <= now.getTime()) {
    return null;
  }
  
  // Calculate the delay in milliseconds
  return specificTime.getTime() - now.getTime();
}

/**
 * Calculate the repeat options for a job
 * 
 * @param job - The job to calculate the repeat options for
 * @returns The repeat options object, or null if the job is not a recurring job or the options are invalid
 */
export function calculateRepeatOptions(job: JobInput): { cron?: string; every?: number } | null {
  switch (job.schedule_type) {
    case ScheduleType.CRON:
      if (!job.cron_expression) {
        return null;
      }
      
      try {
        // Validate the cron expression
        CronExpressionParser.parse(job.cron_expression);
        return { cron: job.cron_expression };
      } catch (error) {
        console.error('Invalid cron expression:', error);
        return null;
      }
      
    case ScheduleType.RECURRING:
      if (!job.interval || !job.interval_value) {
        return null;
      }
      
      // Calculate the interval in milliseconds
      const intervalMs = calculateIntervalInMs(job.interval, job.interval_value);
      if (intervalMs === null) {
        return null;
      }
      
      return { every: intervalMs };
      
    default:
      return null;
  }
}

/**
 * Calculate the next run time for a job
 * 
 * @param job - The job to calculate the next run time for
 * @param lastRun - The last run time of the job, defaults to now
 * @returns The next run time, or null if the job schedule is invalid
 */
export function calculateNextRun(job: JobInput, lastRun: Date = new Date()): Date | null {
  const now = new Date();
  
  switch (job.schedule_type) {
    case ScheduleType.CRON:
      if (!job.cron_expression) {
        return null;
      }
      
      try {
        // Parse the cron expression
        const interval = CronExpressionParser.parse(job.cron_expression, {
          currentDate: lastRun,
        });
        
        // Get the next run time
        const next = interval.next();
        return next.toDate();
      } catch (error) {
        console.error('Error parsing cron expression:', error);
        return null;
      }
      
    case ScheduleType.SPECIFIC_TIME:
      if (!job.specific_time) {
        return null;
      }
      
      const specificTime = new Date(job.specific_time);
      
      // If the specific time is in the past, return null
      if (specificTime.getTime() <= now.getTime()) {
        return null;
      }
      
      return specificTime;
      
    case ScheduleType.RECURRING:
      if (!job.interval || !job.interval_value) {
        return null;
      }
      
      // Calculate the next run time based on the interval
      return calculateNextRunForInterval(job.interval, job.interval_value, lastRun);
      
    default:
      return null;
  }
}

/**
 * Calculate the interval in milliseconds
 * 
 * @param interval - The interval type
 * @param value - The interval value
 * @returns The interval in milliseconds, or null if the interval is invalid
 */
function calculateIntervalInMs(interval: IntervalType, value: number): number | null {
  if (value <= 0) {
    return null;
  }
  
  switch (interval) {
    case IntervalType.MINUTE:
      return value * 60 * 1000; // minutes to milliseconds
    case IntervalType.HOUR:
      return value * 60 * 60 * 1000; // hours to milliseconds
    case IntervalType.DAY:
      return value * 24 * 60 * 60 * 1000; // days to milliseconds
    case IntervalType.WEEK:
      return value * 7 * 24 * 60 * 60 * 1000; // weeks to milliseconds
    default:
      // For month and year, we can't use a fixed millisecond value
      // These will be handled separately in calculateNextRunForInterval
      return null;
  }
}

/**
 * Calculate the next run time for a recurring interval
 * 
 * @param interval - The interval type
 * @param value - The interval value
 * @param lastRun - The last run time
 * @returns The next run time, or null if the interval is invalid
 */
function calculateNextRunForInterval(interval: IntervalType, value: number, lastRun: Date): Date | null {
  if (value <= 0) {
    return null;
  }
  
  const nextRun = new Date(lastRun);
  
  switch (interval) {
    case IntervalType.MINUTE:
      nextRun.setMinutes(nextRun.getMinutes() + value);
      break;
    case IntervalType.HOUR:
      nextRun.setHours(nextRun.getHours() + value);
      break;
    case IntervalType.DAY:
      nextRun.setDate(nextRun.getDate() + value);
      break;
    case IntervalType.WEEK:
      nextRun.setDate(nextRun.getDate() + (value * 7));
      break;
    case IntervalType.MONTH:
      nextRun.setMonth(nextRun.getMonth() + value);
      break;
    case IntervalType.YEAR:
      nextRun.setFullYear(nextRun.getFullYear() + value);
      break;
    default:
      return null;
  }
  
  return nextRun;
}

/**
 * Format a date as an ISO string without milliseconds
 * 
 * @param date - The date to format
 * @returns The formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
