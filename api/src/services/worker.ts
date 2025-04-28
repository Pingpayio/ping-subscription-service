import { WorkerStatus } from '@pingpay/types';
import {
  deriveWorkerAccount,
  registerWorker,
  contractCall,
  TappdClient,
} from '@neardefi/shade-agent-js';

/**
 * Service for managing worker operations
 */
export class WorkerService {
  /**
   * Derive the worker account ID
   */
  async deriveAccountId(): Promise<string> {
    // env dev
    if (process.env.NEXT_PUBLIC_accountId !== undefined) {
      return process.env.NEXT_PUBLIC_accountId;
    }

    // Add this check to prevent TEE operations in local dev
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('TEE operations only available in production');
    }

    return await deriveWorkerAccount();
  }

  /**
   * Register the worker
   */
  async register(): Promise<boolean> {
    // env dev
    if (process.env.NEXT_PUBLIC_accountId !== undefined) {
      // getting collateral won't work with a simulated TEE quote
      console.log(
        'cannot register while running tappd simulator:',
        process.env.DSTACK_SIMULATOR_ENDPOINT,
      );
      return false;
    }

    return await registerWorker();
  }

  /**
   * Verify the worker's TEE attestation
   */
  async verify(): Promise<boolean> {
    try {
      const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
      const client = new TappdClient(endpoint);

      // get tcb info from tappd
      const { tcb_info } = await client.getInfo();
      const { app_compose } = JSON.parse(tcb_info);
      // first sha256: match of docker-compose.yaml will be codehash (arrange docker-compose.yaml accordingly)
      const [codehash] = app_compose.match(/sha256:([a-f0-9]*)/gim);

      try {
        await contractCall({
          methodName: 'is_verified_by_codehash',
          args: {
            codehash,
          },
        });
        return true;
      } catch (e) {
        return false;
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      throw new Error('Failed to verify worker');
    }
  }
}

// Export singleton instance
export const workerService = new WorkerService();
