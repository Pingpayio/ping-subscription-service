import {
  Subscription,
  WorkerStatus,
  Merchant,
  MonitoringStatus
} from '@ping-subscription/types';

/**
 * SDK configuration options
 */
export interface SubscriptionSDKOptions {
  /**
   * API URL for the subscription service
   * @default 'http://localhost:3000'
   */
  apiUrl?: string;
}

/**
 * Subscription creation parameters
 */
export interface CreateSubscriptionParams {
  /**
   * Merchant ID
   */
  merchantId: string;
  
  /**
   * Subscription amount in yoctoNEAR (10^-24 NEAR)
   */
  amount: string;
  
  /**
   * Subscription frequency in seconds
   */
  frequency: number;
  
  /**
   * Maximum number of payments (optional)
   */
  maxPayments?: number;
  
  /**
   * Token address for FT payments (optional)
   */
  tokenAddress?: string;
}

/**
 * Subscription SDK for interacting with the Ping Subscription Service
 * Browser-compatible version
 */
export class SubscriptionSDK {
  private apiUrl: string;

  /**
   * Create a new SubscriptionSDK instance
   * @param options SDK configuration options
   */
  constructor(options: SubscriptionSDKOptions = {}) {
    this.apiUrl = options.apiUrl || 'http://localhost:3000';
  }

  /**
   * Get worker address
   * @returns Worker account ID
   */
  async getWorkerAddress(): Promise<string> {
    const response = await fetch(`${this.apiUrl}/api/derive`);
    const data = await response.json();
    return data.accountId;
  }

  /**
   * Check if the worker is verified
   * @returns Whether the worker is verified
   */
  async isWorkerVerified(): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/api/isVerified`);
    const data = await response.json();
    return data.verified;
  }

  /**
   * Get worker account ID
   * @returns Worker status with account ID
   */
  async getWorkerAccount(): Promise<WorkerStatus> {
    const response = await fetch(`${this.apiUrl}/api/derive`);
    return await response.json();
  }

  /**
   * Register worker with the contract
   * @returns Worker status with registration result
   */
  async registerWorker(): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/api/register`);
    const data = await response.json();
    return data.registered;
  }

  /**
   * Get all merchants
   * @returns List of merchants
   */
  async getMerchants(): Promise<{ merchants: Merchant[] }> {
    const response = await fetch(`${this.apiUrl}/api/merchants`);
    return await response.json();
  }

  /**
   * Create a new subscription
   * @param params Subscription creation parameters
   * @returns Subscription creation result
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<{ success: boolean; subscriptionId: string }> {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        merchantId: params.merchantId,
        amount: params.amount,
        frequency: params.frequency,
        maxPayments: params.maxPayments,
        tokenAddress: params.tokenAddress,
      }),
    });
    return await response.json();
  }

  /**
   * Get a subscription by ID
   * @param subscriptionId Subscription ID
   * @returns Subscription details
   */
  async getSubscription(subscriptionId: string): Promise<{ subscription: Subscription }> {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get',
        subscriptionId,
      }),
    });
    return await response.json();
  }

  /**
   * Get all subscriptions for a user
   * @param accountId User account ID
   * @returns List of subscriptions
   */
  async getUserSubscriptions(accountId: string): Promise<{ subscriptions: Subscription[] }> {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'list',
        accountId,
      }),
    });
    return await response.json();
  }

  /**
   * Pause a subscription
   * @param subscriptionId Subscription ID
   * @returns Operation result
   */
  async pauseSubscription(subscriptionId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'pause',
        subscriptionId,
      }),
    });
    return await response.json();
  }

  /**
   * Resume a paused subscription
   * @param subscriptionId Subscription ID
   * @returns Operation result
   */
  async resumeSubscription(subscriptionId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'resume',
        subscriptionId,
      }),
    });
    return await response.json();
  }

  /**
   * Cancel a subscription
   * @param subscriptionId Subscription ID
   * @returns Operation result
   */
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
        subscriptionId,
      }),
    });
    return await response.json();
  }

  /**
   * Start monitoring subscriptions
   * @param interval Monitoring interval in milliseconds (default: 60000)
   * @returns Operation result
   */
  async startMonitoring(interval?: number): Promise<{ success: boolean; message: string; isMonitoring: boolean }> {
    const response = await fetch(`${this.apiUrl}/api/monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start',
        interval,
      }),
    });
    return await response.json();
  }

  /**
   * Stop monitoring subscriptions
   * @returns Operation result
   */
  async stopMonitoring(): Promise<{ success: boolean; message: string; isMonitoring: boolean }> {
    const response = await fetch(`${this.apiUrl}/api/monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'stop',
      }),
    });
    return await response.json();
  }

  /**
   * Get monitoring status
   * @returns Monitoring status
   */
  async getMonitoringStatus(): Promise<MonitoringStatus> {
    const response = await fetch(`${this.apiUrl}/api/monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'status',
      }),
    });
    return await response.json();
  }
}

// Export default instance
export default SubscriptionSDK;
