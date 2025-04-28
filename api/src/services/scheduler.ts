import { SchedulerJobConfig } from '../types/index.js';

/**
 * Service for interacting with the PingPay Scheduler Service
 */
export class SchedulerService {
  private schedulerApiUrl: string;

  constructor() {
    if (!process.env.SCHEDULER_API_URL) {
      throw new Error('SCHEDULER_API_URL environment variable is required');
    }
    this.schedulerApiUrl = process.env.SCHEDULER_API_URL;
  }

  /**
   * Create a new scheduler job for a subscription
   */
  async createSubscriptionJob(subscriptionId: string, frequency: string, interval: number): Promise<string> {
    const jobConfig: SchedulerJobConfig = {
      name: `subscription-payment-${subscriptionId}`,
      description: `Process payment for subscription ${subscriptionId}`,
      type: 'http',
      target: `${process.env.API_BASE_URL}/api/trigger-payment`,
      payload: {
        subscription_id: subscriptionId
      },
      schedule_type: 'recurring',
      interval: frequency,
      interval_value: interval
    };

    try {
      const response = await fetch(`${this.schedulerApiUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobConfig)
      });

      if (!response.ok) {
        throw new Error(`Failed to create scheduler job: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error creating scheduler job:', error);
      throw new Error('Failed to create scheduler job');
    }
  }

  /**
   * Update a scheduler job's status (e.g., when pausing/resuming a subscription)
   */
  async updateJobStatus(jobId: string, status: 'active' | 'inactive'): Promise<void> {
    try {
      const response = await fetch(`${this.schedulerApiUrl}/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`Failed to update job status: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      throw new Error('Failed to update job status');
    }
  }

  /**
   * Delete a scheduler job (e.g., when cancelling a subscription)
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      const response = await fetch(`${this.schedulerApiUrl}/jobs/${jobId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      throw new Error('Failed to delete job');
    }
  }

  /**
   * Find a job by subscription ID
   */
  async findJobBySubscriptionId(subscriptionId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.schedulerApiUrl}/jobs?name=subscription-payment-${subscriptionId}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to find job: ${response.statusText}`);
      }

      const jobs = await response.json();
      return jobs.length > 0 ? jobs[0].id : null;
    } catch (error) {
      console.error('Error finding job:', error);
      throw new Error('Failed to find job');
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
