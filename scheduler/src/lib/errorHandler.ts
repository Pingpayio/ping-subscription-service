/**
 * Error handling utilities for the scheduler service
 * 
 * This module provides error categorization, logging, and retry functionality
 * for HTTP requests and other operations.
 */
import { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import pRetry from 'p-retry';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

/**
 * Error categories for better error handling
 */
export enum ErrorCategory {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  CLIENT = 'client',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

/**
 * Categorize errors based on their type and properties
 * 
 * @param error - The error to categorize
 * @returns The error category
 */
export function categorizeError(error: Error): ErrorCategory {
  if (error instanceof z.ZodError) {
    return ErrorCategory.VALIDATION;
  }
  
  if (error instanceof AxiosError) {
    if (!error.response) {
      // Network error or timeout
      if (error.code === 'ECONNABORTED') return ErrorCategory.TIMEOUT;
      if (error.code === 'ConnectionRefused') return ErrorCategory.NETWORK;
      if (error.message.includes('timeout')) return ErrorCategory.TIMEOUT;
      if (error.message.includes('network') || error.message.includes('connect')) return ErrorCategory.NETWORK;
      return ErrorCategory.NETWORK;
    }
    
    const status = error.response.status;
    if (status >= 400 && status < 500) return ErrorCategory.CLIENT;
    if (status >= 500) return ErrorCategory.SERVER;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Configure axios-retry for automatic retries
 * 
 * @param axiosInstance - The axios instance to configure
 */
export function configureAxiosRetry(axiosInstance) {
  axiosRetry(axiosInstance, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      const category = categorizeError(error);
      // Only retry network errors, timeouts, and server errors
      return [
        ErrorCategory.NETWORK, 
        ErrorCategory.TIMEOUT, 
        ErrorCategory.SERVER
      ].includes(category);
    },
    onRetry: (retryCount, error, requestConfig) => {
      console.log(`Retrying request to ${requestConfig.url} (attempt ${retryCount})`);
    }
  });
}

/**
 * Truncate error logs to prevent excessive log output
 * 
 * @param error - The error to truncate
 * @param maxLength - The maximum length of the error string
 * @returns The truncated error string
 */
export function truncateErrorLog(error: any, maxLength: number = 500): string {
  if (error instanceof Error) {
    // For Error objects, just return the message and stack
    return `${error.name}: ${error.message}\n${error.stack?.substring(0, maxLength) || ''}`;
  }
  
  try {
    const errorStr = JSON.stringify(error);
    if (errorStr.length <= maxLength) return errorStr;
    return errorStr.substring(0, maxLength) + '... [truncated]';
  } catch (e) {
    // If JSON.stringify fails, return a simple string representation
    return `${error}`.substring(0, maxLength) + (String(error).length > maxLength ? '... [truncated]' : '');
  }
}

/**
 * Create a retry function with exponential backoff
 * 
 * @param operation - The operation to retry
 * @param options - Retry options
 * @returns A function that will retry the operation
 */
export function createRetryFunction<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    minTimeout?: number;
    maxTimeout?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  return pRetry(operation, {
    retries: options.retries || 3,
    minTimeout: options.minTimeout || 1000,
    maxTimeout: options.maxTimeout || 30000,
    onFailedAttempt: (error) => {
      if (options.onRetry) {
        options.onRetry(error, error.attemptNumber);
      } else {
        console.log(
          `Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
      }
    }
  });
}

/**
 * Check if an error is retryable
 * 
 * @param error - The error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const category = categorizeError(error);
  return [
    ErrorCategory.NETWORK, 
    ErrorCategory.TIMEOUT, 
    ErrorCategory.SERVER
  ].includes(category);
}
