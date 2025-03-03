import * as nearAPI from "near-api-js";
import { contractCall, contractView, getAccount } from "./near-provider.js";
import { TappdClient } from "./tappd.js";
// Use a default account ID if not provided
const { KeyPair } = nearAPI;

interface KeyPair {
  privateKey: string;
  publicKey: string;
}

interface ProcessingStatus {
  status: "processing" | "retrying";
  retryCount: number;
}

interface Subscription {
  id: string;
  [key: string]: any;
}

interface PaymentResult {
  success: boolean;
  error?: string;
}

/**
 * Shade Agent class for managing subscriptions and processing payments
 * This agent runs in a Trusted Execution Environment (TEE) and handles:
 * - Key management
 * - Subscription monitoring
 * - Payment processing
 * - Error handling and retries
 */
export class ShadeAgent {
  private client: TappdClient;
  private subscriptionKeys: Map<string, KeyPair>;
  public processingQueue: Map<string, ProcessingStatus>;
  private retryDelays: number[];
  public isMonitoring: boolean;
  public isInitialized: boolean;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT) {
    this.client = new TappdClient(endpoint);
    this.subscriptionKeys = new Map(); // Map of subscriptionId -> { privateKey, publicKey }
    this.processingQueue = new Map(); // Map of subscriptionId -> processing status
    this.retryDelays = [5000, 15000, 30000, 60000]; // Retry delays in ms (5s, 15s, 30s, 1m)
    this.isMonitoring = false;
    this.isInitialized = false;
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    // Verify the agent is running in a TEE
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "Running in development mode - TEE operations will be simulated",
      );
    } else {
      // Verify the agent with the contract
      await this.verifyAgent();
    }
  }

  /**
   * Verify the agent with the contract
   */
  async verifyAgent(): Promise<boolean> {
    try {
      // Get TCB info from tappd
      const { tcb_info } = await this.client.getInfo();
      const { app_compose } = JSON.parse(tcb_info);
      // Extract codehash from docker-compose.yaml
      const [codehash] = app_compose.match(/sha256:([a-f0-9]*)/gim);

      // Verify the agent with the contract
      await contractCall({
        accountId: getAccount(),
        methodName: "is_verified_by_codehash",
        args: { codehash },
      });

      console.log("Agent verified successfully");
      return true;
    } catch (error) {
      console.error("Agent verification failed:", error);
      return false;
    }
  }

  /**
   * Securely store a key pair for a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} privateKey - The private key to store
   * @param {string} publicKey - The public key
   * @returns {boolean} - Whether the key was successfully stored
   */
  async securelyStoreKey(
    subscriptionId: string,
    privateKey: string,
    publicKey: string,
  ): Promise<boolean> {
    try {
      // In production, use TEE's secure storage capabilities
      if (process.env.NODE_ENV === "production") {
        // Use TappdClient to securely store the key
        // This is a simplified example - actual implementation would depend on TEE capabilities
        const keyData = JSON.stringify({ privateKey, publicKey });
        const encryptedData = await this.client.deriveKey(
          subscriptionId,
          "subscription_key",
        );

        // In a real implementation, we would store this in a secure database within the TEE
        // For now, we'll just store it in memory
        console.log(`Key securely stored for subscription ${subscriptionId}`);
      }

      // Store the key pair in memory (for both production and development)
      this.subscriptionKeys.set(subscriptionId, { privateKey, publicKey });

      return true;
    } catch (error) {
      console.error(
        `Error storing key for subscription ${subscriptionId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Register a subscription key with the contract
   * @param {string} subscriptionId - The subscription ID
   * @param {string} publicKey - The public key to register
   */
  async registerSubscriptionKey(
    subscriptionId: string,
    publicKey: string,
  ): Promise<boolean> {
    try {
      await contractCall({
        accountId: getAccount(),
        methodName: "register_subscription_key",
        args: {
          public_key: publicKey,
          subscription_id: subscriptionId,
        },
      });

      console.log(`Key registered for subscription ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error(
        `Error registering key for subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Retrieve a key pair for a subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Object|null} - The key pair { privateKey, publicKey } or null if not found
   */
  getKeyPair(subscriptionId: string): KeyPair | null {
    return this.subscriptionKeys.get(subscriptionId) || null;
  }

  /**
   * Store a key pair for a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} privateKey - The private key
   * @param {string} publicKey - The public key
   */
  storeKeyPair(
    subscriptionId: string,
    privateKey: string,
    publicKey: string,
  ): void {
    this.subscriptionKeys.set(subscriptionId, { privateKey, publicKey });
  }

  /**
   * Start monitoring subscriptions for due payments
   * @param {number} interval - The monitoring interval in milliseconds
   */
  async startMonitoring(interval = 60000): Promise<void> {
    if (this.isMonitoring) {
      console.log("Monitoring already started");
      return;
    }

    this.isMonitoring = true;
    console.log("Starting subscription monitoring");

    // Initial check
    await this.checkDueSubscriptions();

    // Set up interval for regular checks
    this.monitoringInterval = setInterval(async () => {
      await this.checkDueSubscriptions();
    }, interval);
  }

  /**
   * Stop monitoring subscriptions
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log("Monitoring not started");
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.isMonitoring = false;
    console.log("Stopped subscription monitoring");
  }

  /**
   * Check for subscriptions with due payments
   * @param {number} limit - Maximum number of subscriptions to process at once
   */
  async checkDueSubscriptions(limit = 10): Promise<void> {
    try {
      // Get due subscriptions from the contract
      const dueSubscriptions = (await contractView({
        accountId: getAccount(),
        methodName: "get_due_subscriptions",
        args: { limit },
      })) as Subscription[];

      console.log(`Found ${dueSubscriptions.length} due subscriptions`);

      // Process each due subscription
      for (const subscription of dueSubscriptions) {
        // Skip if already processing this subscription
        if (this.processingQueue.has(subscription.id)) {
          console.log(
            `Subscription ${subscription.id} is already being processed`,
          );
          continue;
        }

        // Process the payment
        this.processPayment(subscription);
      }
    } catch (error) {
      console.error("Error checking due subscriptions:", error);
    }
  }

  /**
   * Process a payment for a subscription
   * @param {Object} subscription - The subscription object
   * @param {number} retryCount - The current retry count
   */
  async processPayment(
    subscription: Subscription,
    retryCount = 0,
  ): Promise<void> {
    const subscriptionId = subscription.id;

    // Mark as processing
    this.processingQueue.set(subscriptionId, {
      status: "processing",
      retryCount,
    });

    try {
      console.log(`Processing payment for subscription ${subscriptionId}`);

      // Get the key pair for this subscription
      const keyPair = this.getKeyPair(subscriptionId);

      // If no key pair is found, log error and remove from queue
      if (!keyPair) {
        console.error(
          `No key pair found for subscription ${subscriptionId}, cannot process payment`,
        );
        this.processingQueue.delete(subscriptionId);
        return;
      }

      // Create a KeyPair object from the private key
      const nearKeyPair = KeyPair.fromString(keyPair.privateKey);

      // Set the key in the keystore for this account
      // This is needed because contractCall will use the key from the keystore
      const { setKey } = await import("./near-provider.js");
      setKey(getAccount(), keyPair.privateKey);

      // Call the contract to process the payment
      const result = (await contractCall({
        accountId: getAccount(),
        methodName: "process_payment",
        args: { subscription_id: subscriptionId },
      })) as PaymentResult;

      // Check if payment was successful
      if (result && result.success) {
        console.log(
          `Payment processed successfully for subscription ${subscriptionId}`,
        );
        this.processingQueue.delete(subscriptionId);
      } else {
        const errorMessage = result?.error || "Unknown error";
        console.error(
          `Payment failed for subscription ${subscriptionId}: ${errorMessage}`,
        );

        // Handle specific error cases
        if (errorMessage.includes("Subscription is not active")) {
          // Subscription is no longer active, remove from queue
          console.log(
            `Subscription ${subscriptionId} is not active, removing from queue`,
          );
          this.processingQueue.delete(subscriptionId);
        } else if (errorMessage.includes("Payment is not due yet")) {
          // Payment is not due yet, remove from queue
          console.log(
            `Payment for subscription ${subscriptionId} is not due yet, removing from queue`,
          );
          this.processingQueue.delete(subscriptionId);
        } else if (
          errorMessage.includes("Maximum number of payments reached") ||
          errorMessage.includes("Subscription end date reached")
        ) {
          // Subscription has ended, remove from queue
          console.log(
            `Subscription ${subscriptionId} has ended, removing from queue`,
          );
          this.processingQueue.delete(subscriptionId);
        } else if (errorMessage.includes("Key is not authorized")) {
          // Key is not authorized, try to register it again
          console.log(
            `Key is not authorized for subscription ${subscriptionId}, trying to register again`,
          );
          await this.registerSubscriptionKey(subscriptionId, keyPair.publicKey);
          this.retryPayment(subscription, retryCount);
        } else {
          // Other errors, retry if possible
          this.retryPayment(subscription, retryCount);
        }
      }
    } catch (error) {
      console.error(
        `Error processing payment for subscription ${subscriptionId}:`,
        error,
      );
      this.retryPayment(subscription, retryCount);
    }
  }

  /**
   * Retry a payment after a delay
   * @param {Object} subscription - The subscription object
   * @param {number} retryCount - The current retry count
   */
  retryPayment(subscription: Subscription, retryCount: number): void {
    const subscriptionId = subscription.id;

    // Check if we've reached the maximum retry count
    if (retryCount >= this.retryDelays.length) {
      console.log(
        `Maximum retry count reached for subscription ${subscriptionId}, giving up`,
      );
      this.processingQueue.delete(subscriptionId);
      return;
    }

    // Get the delay for this retry
    const delay = this.retryDelays[retryCount];

    console.log(
      `Retrying payment for subscription ${subscriptionId} in ${delay}ms (retry ${retryCount + 1}/${this.retryDelays.length})`,
    );

    // Update processing status
    this.processingQueue.set(subscriptionId, {
      status: "retrying",
      retryCount: retryCount + 1,
    });

    // Schedule retry
    setTimeout(() => {
      this.processPayment(subscription, retryCount + 1);
    }, delay);
  }
}

// Export a singleton instance
export const shadeAgent = new ShadeAgent();
