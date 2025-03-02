/**
 * NEAR Subscription Service SDK
 *
 * This SDK provides methods to interact with the NEAR Subscription Service.
 */

import { contractCall, contractView } from "../utils/near-provider.js";

/**
 * SubscriptionSDK class for interacting with the NEAR Subscription Service
 */
export class SubscriptionSDK {
  /**
   * Create a new SubscriptionSDK instance
   * @param {Object} options - Configuration options
   * @param {string} options.apiUrl - The URL of the API server
   */
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || "http://localhost:3000";
  }

  /**
   * Get the worker agent address
   * @returns {Promise<string>} The worker agent address
   */
  async getWorkerAddress() {
    const response = await fetch(`${this.apiUrl}/api/derive`);
    const data = await response.json();
    return data.accountId;
  }

  /**
   * Check if the worker is verified
   * @returns {Promise<boolean>} Whether the worker is verified
   */
  async isWorkerVerified() {
    const response = await fetch(`${this.apiUrl}/api/isVerified`);
    const data = await response.json();
    return data.verified;
  }

  /**
   * Register the worker
   * @returns {Promise<boolean>} Whether the registration was successful
   */
  async registerWorker() {
    const response = await fetch(`${this.apiUrl}/api/register`);
    const data = await response.json();
    return data.registered;
  }

  /**
   * Get merchants
   * @returns {Promise<Array>} List of merchants
   */
  async getMerchants() {
    const response = await fetch(`${this.apiUrl}/api/merchants`);
    const data = await response.json();
    return data.merchants;
  }

  /**
   * Create a subscription
   * @param {Object} params - Subscription parameters
   * @param {string} params.merchantId - Merchant ID
   * @param {string} params.amount - Amount to pay
   * @param {number} params.frequency - Payment frequency in seconds
   * @param {number} params.maxPayments - Maximum number of payments
   * @param {string} [params.tokenAddress] - Token address for non-NEAR payments
   * @returns {Promise<Object>} Subscription creation result
   */
  async createSubscription(params) {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "create",
        ...params,
      }),
    });
    return await response.json();
  }

  /**
   * Get a subscription by ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscription(subscriptionId) {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "get",
        subscriptionId,
      }),
    });
    return await response.json();
  }

  /**
   * Get subscriptions for a user
   * @param {string} accountId - User account ID
   * @returns {Promise<Array>} List of subscriptions
   */
  async getUserSubscriptions(accountId) {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "list",
        accountId,
      }),
    });
    return await response.json();
  }

  /**
   * Pause a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Result of the operation
   */
  async pauseSubscription(subscriptionId) {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "pause",
        subscriptionId,
      }),
    });
    return await response.json();
  }

  /**
   * Resume a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Result of the operation
   */
  async resumeSubscription(subscriptionId) {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "resume",
        subscriptionId,
      }),
    });
    return await response.json();
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Result of the operation
   */
  async cancelSubscription(subscriptionId) {
    const response = await fetch(`${this.apiUrl}/api/subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "cancel",
        subscriptionId,
      }),
    });
    return await response.json();
  }

  /**
   * Start monitoring subscriptions
   * @param {number} [interval=60000] - Monitoring interval in milliseconds
   * @returns {Promise<Object>} Result of the operation
   */
  async startMonitoring(interval = 60000) {
    const response = await fetch(`${this.apiUrl}/api/monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "start",
        interval,
      }),
    });
    return await response.json();
  }

  /**
   * Stop monitoring subscriptions
   * @returns {Promise<Object>} Result of the operation
   */
  async stopMonitoring() {
    const response = await fetch(`${this.apiUrl}/api/monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "stop",
      }),
    });
    return await response.json();
  }

  /**
   * Get monitoring status
   * @returns {Promise<Object>} Monitoring status
   */
  async getMonitoringStatus() {
    const response = await fetch(`${this.apiUrl}/api/monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "status",
      }),
    });
    return await response.json();
  }
}

export default SubscriptionSDK;
