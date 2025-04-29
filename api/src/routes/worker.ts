import { Hono } from "hono";
import { workerService } from "../services/worker.js";
import { WorkerStatus } from "@pingpay/types";

// Create router instance
const router = new Hono();

/**
 * Get worker account ID
 */
router.get("/derive", async (c) => {
  try {
    const accountId = await workerService.deriveAccountId();
    return c.json({
      accountId,
    } as WorkerStatus);
  } catch (error) {
    console.error("Error deriving account ID:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

/**
 * Register worker
 */
router.get("/register", async (c) => {
  try {
    const registered = await workerService.register();
    return c.json({ registered } as WorkerStatus);
  } catch (error) {
    console.error("Error registering worker:", error);
    return c.json({
      registered: false,
      error: (error as Error).message,
    } as WorkerStatus);
  }
});

/**
 * Verify worker
 */
router.get("/verify", async (c) => {
  try {
    const verified = await workerService.verify();
    return c.json({ verified } as WorkerStatus);
  } catch (error) {
    console.error("Error verifying worker:", error);
    return c.json({
      verified: false,
      error: (error as Error).message,
    } as WorkerStatus);
  }
});

export default router;
