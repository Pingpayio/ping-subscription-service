import { Hono } from "hono";
import { balanceService } from "../services/balance.js";

// Create router instance
const router = new Hono();

/**
 * Get balance for an account
 */
router.get("/:accountId", async (c) => {
  try {
    const accountId = c.req.param("accountId");
    const balance = await balanceService.getBalance(accountId);
    return c.json({ balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default router;
