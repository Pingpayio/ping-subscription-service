import { getBalance } from "@neardefi/shade-agent-js";

/**
 * Service for managing balance operations
 */
export class BalanceService {
  /**
   * Get balance for an account
   */
  async getBalance(accountId: string): Promise<string> {
    if (!accountId) {
      throw new Error("Account ID is required");
    }

    return await getBalance(accountId);
  }
}

// Export singleton instance
export const balanceService = new BalanceService();
