import { shadeAgent } from '@pingpay/subscription-sdk';
import { contractCall } from '@neardefi/shade-agent-js';

/**
 * Service for managing TEE operations and payment processing
 */
export class AgentService {
  /**
   * Store a subscription key pair in the TEE
   */
  async storeSubscriptionKey(subscriptionId: string, privateKey: string, publicKey: string): Promise<boolean> {
    try {
      return await shadeAgent.securelyStoreKey(subscriptionId, privateKey, publicKey);
    } catch (error) {
      console.error('Error storing subscription key:', error);
      throw new Error('Failed to store subscription key in TEE');
    }
  }

  /**
   * Process a payment for a subscription
   */
  async processPayment(subscriptionId: string): Promise<boolean> {
    try {
      // Retrieve the private key from TEE storage
      const privateKey = await shadeAgent.retrieveKey(subscriptionId);
      if (!privateKey) {
        throw new Error(`No private key found for subscription ${subscriptionId}`);
      }

      // Process the payment using the contract
      await contractCall({
        methodName: 'process_payment',
        args: { subscription_id: subscriptionId }
      });

      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      // Depending on the error type, we might want to retry or handle differently
      if (error.message.includes('insufficient allowance')) {
        throw new Error('Payment failed: Insufficient allowance');
      } else if (error.message.includes('subscription not found')) {
        throw new Error('Payment failed: Subscription not found');
      } else {
        throw new Error('Payment processing failed');
      }
    }
  }

  /**
   * Initialize the agent if needed
   */
  async ensureInitialized(): Promise<void> {
    if (!shadeAgent.isInitialized) {
      await shadeAgent.initialize();
      shadeAgent.isInitialized = true;
    }
  }

  /**
   * Verify the agent's TEE attestation
   */
  async verifyAttestation(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      // Add attestation verification logic here
      return true;
    } catch (error) {
      console.error('Error verifying attestation:', error);
      throw new Error('Failed to verify TEE attestation');
    }
  }
}

// Export singleton instance
export const agentService = new AgentService();
