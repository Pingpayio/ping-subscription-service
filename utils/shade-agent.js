import { TappdClient } from './tappd.js';
import { contractCall, contractView } from './near-provider.js';
import { generateSeedPhrase } from 'near-seed-phrase';
import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI;

/**
 * Shade Agent class for managing subscriptions and processing payments
 * This agent runs in a Trusted Execution Environment (TEE) and handles:
 * - Key management
 * - Subscription monitoring
 * - Payment processing
 * - Error handling and retries
 */
export class ShadeAgent {
  constructor(endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT) {
    this.client = new TappdClient(endpoint);
    this.subscriptionKeys = new Map(); // Map of subscriptionId -> { privateKey, publicKey }
    this.processingQueue = new Map(); // Map of subscriptionId -> processing status
    this.retryDelays = [5000, 15000, 30000, 60000]; // Retry delays in ms (5s, 15s, 30s, 1m)
    this.isMonitoring = false;
  }

  /**
   * Initialize the agent
   */
  async initialize() {
    // Verify the agent is running in a TEE
    if (process.env.NODE_ENV !== 'production') {
      console.log('Running in development mode - TEE operations will be simulated');
    } else {
      // Verify the agent with the contract
      await this.verifyAgent();
    }
  }

  /**
   * Verify the agent with the contract
   */
  async verifyAgent() {
    try {
      // Get TCB info from tappd
      const { tcb_info } = await this.client.getInfo();
      const { app_compose } = JSON.parse(tcb_info);
      // Extract codehash from docker-compose.yaml
      const [codehash] = app_compose.match(/sha256:([a-f0-9]*)/gim);

      // Verify the agent with the contract
      await contractCall({
        methodName: 'is_verified_by_codehash',
        args: { codehash },
      });
      
      console.log('Agent verified successfully');
      return true;
    } catch (error) {
      console.error('Agent verification failed:', error);
      return false;
    }
  }

  /**
   * Generate a key pair for a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} seed - Optional seed for deterministic key generation
   * @returns {Object} - The generated key pair { privateKey, publicKey }
   */
  async generateKeyPair(subscriptionId, seed) {
    try {
      // Generate entropy from TEE hardware if in production
      let entropy;
      if (process.env.NODE_ENV === 'production') {
        // Get entropy from TEE hardware
        const randomString = Math.random().toString();
        const keyFromTee = await this.client.deriveKey(randomString, randomString);
        
        // Create a unique seed for this subscription
        const randomArray = new Uint8Array(32);
        crypto.getRandomValues(randomArray);
        
        // Combine TEE entropy with subscription ID for uniqueness
        entropy = await crypto.subtle.digest(
          'SHA-256',
          Buffer.concat([
            randomArray, 
            keyFromTee.asUint8Array(32),
            Buffer.from(subscriptionId)
          ]),
        );
      } else {
        // In development, use a deterministic seed if provided, or generate a random one
        entropy = seed ? 
          Buffer.from(seed) : 
          Buffer.from(Math.random().toString());
      }
      
      // Generate key pair from entropy
      const { secretKey, publicKey } = generateSeedPhrase(entropy);
      
      // Store the key pair
      this.subscriptionKeys.set(subscriptionId, { privateKey: secretKey, publicKey });
      
      return { privateKey: secretKey, publicKey };
    } catch (error) {
      console.error(`Error generating key pair for subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Register a subscription key with the contract
   * @param {string} subscriptionId - The subscription ID
   * @param {string} publicKey - The public key to register
   */
  async registerSubscriptionKey(subscriptionId, publicKey) {
    try {
      await contractCall({
        methodName: 'register_subscription_key',
        args: {
          public_key: publicKey,
          subscription_id: subscriptionId,
        },
      });
      
      console.log(`Key registered for subscription ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error(`Error registering key for subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a key pair for a subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Object|null} - The key pair { privateKey, publicKey } or null if not found
   */
  getKeyPair(subscriptionId) {
    return this.subscriptionKeys.get(subscriptionId) || null;
  }

  /**
   * Store a key pair for a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} privateKey - The private key
   * @param {string} publicKey - The public key
   */
  storeKeyPair(subscriptionId, privateKey, publicKey) {
    this.subscriptionKeys.set(subscriptionId, { privateKey, publicKey });
  }

  /**
   * Start monitoring subscriptions for due payments
   * @param {number} interval - The monitoring interval in milliseconds
   */
  async startMonitoring(interval = 60000) {
    if (this.isMonitoring) {
      console.log('Monitoring already started');
      return;
    }
    
    this.isMonitoring = true;
    console.log('Starting subscription monitoring');
    
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
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('Monitoring not started');
      return;
    }
    
    clearInterval(this.monitoringInterval);
    this.isMonitoring = false;
    console.log('Stopped subscription monitoring');
  }

  /**
   * Check for subscriptions with due payments
   * @param {number} limit - Maximum number of subscriptions to process at once
   */
  async checkDueSubscriptions(limit = 10) {
    try {
      // Get due subscriptions from the contract
      const dueSubscriptions = await contractView({
        methodName: 'get_due_subscriptions',
        args: { limit },
      });
      
      console.log(`Found ${dueSubscriptions.length} due subscriptions`);
      
      // Process each due subscription
      for (const subscription of dueSubscriptions) {
        // Skip if already processing this subscription
        if (this.processingQueue.has(subscription.id)) {
          console.log(`Subscription ${subscription.id} is already being processed`);
          continue;
        }
        
        // Process the payment
        this.processPayment(subscription);
      }
    } catch (error) {
      console.error('Error checking due subscriptions:', error);
    }
  }

  /**
   * Process a payment for a subscription
   * @param {Object} subscription - The subscription object
   * @param {number} retryCount - The current retry count
   */
  async processPayment(subscription, retryCount = 0) {
    const subscriptionId = subscription.id;
    
    // Mark as processing
    this.processingQueue.set(subscriptionId, { status: 'processing', retryCount });
    
    try {
      console.log(`Processing payment for subscription ${subscriptionId}`);
      
      // Get the key pair for this subscription
      let keyPair = this.getKeyPair(subscriptionId);
      
      // If no key pair is found, try to generate one
      if (!keyPair) {
        console.log(`No key pair found for subscription ${subscriptionId}, generating new one`);
        keyPair = await this.generateKeyPair(subscriptionId);
        
        // Register the key with the contract
        await this.registerSubscriptionKey(subscriptionId, keyPair.publicKey);
      }
      
      // Create a KeyPair object from the private key
      const nearKeyPair = KeyPair.fromString(keyPair.privateKey);
      
      // Call the contract to process the payment
      const result = await contractCall({
        methodName: 'process_payment',
        args: { subscription_id: subscriptionId },
        keyPair: nearKeyPair,
      });
      
      // Check if payment was successful
      if (result && result.success) {
        console.log(`Payment processed successfully for subscription ${subscriptionId}`);
        this.processingQueue.delete(subscriptionId);
      } else {
        const errorMessage = result?.error || 'Unknown error';
        console.error(`Payment failed for subscription ${subscriptionId}: ${errorMessage}`);
        
        // Handle specific error cases
        if (errorMessage.includes('Subscription is not active')) {
          // Subscription is no longer active, remove from queue
          console.log(`Subscription ${subscriptionId} is not active, removing from queue`);
          this.processingQueue.delete(subscriptionId);
        } else if (errorMessage.includes('Payment is not due yet')) {
          // Payment is not due yet, remove from queue
          console.log(`Payment for subscription ${subscriptionId} is not due yet, removing from queue`);
          this.processingQueue.delete(subscriptionId);
        } else if (errorMessage.includes('Maximum number of payments reached') || 
                  errorMessage.includes('Subscription end date reached')) {
          // Subscription has ended, remove from queue
          console.log(`Subscription ${subscriptionId} has ended, removing from queue`);
          this.processingQueue.delete(subscriptionId);
        } else if (errorMessage.includes('Key is not authorized')) {
          // Key is not authorized, try to register it again
          console.log(`Key is not authorized for subscription ${subscriptionId}, trying to register again`);
          await this.registerSubscriptionKey(subscriptionId, keyPair.publicKey);
          this.retryPayment(subscription, retryCount);
        } else {
          // Other errors, retry if possible
          this.retryPayment(subscription, retryCount);
        }
      }
    } catch (error) {
      console.error(`Error processing payment for subscription ${subscriptionId}:`, error);
      this.retryPayment(subscription, retryCount);
    }
  }

  /**
   * Retry a payment after a delay
   * @param {Object} subscription - The subscription object
   * @param {number} retryCount - The current retry count
   */
  retryPayment(subscription, retryCount) {
    const subscriptionId = subscription.id;
    
    // Check if we've reached the maximum retry count
    if (retryCount >= this.retryDelays.length) {
      console.log(`Maximum retry count reached for subscription ${subscriptionId}, giving up`);
      this.processingQueue.delete(subscriptionId);
      return;
    }
    
    // Get the delay for this retry
    const delay = this.retryDelays[retryCount];
    
    console.log(`Retrying payment for subscription ${subscriptionId} in ${delay}ms (retry ${retryCount + 1}/${this.retryDelays.length})`);
    
    // Update processing status
    this.processingQueue.set(subscriptionId, { status: 'retrying', retryCount: retryCount + 1 });
    
    // Schedule retry
    setTimeout(() => {
      this.processPayment(subscription, retryCount + 1);
    }, delay);
  }
}

// Export a singleton instance
export const shadeAgent = new ShadeAgent();
