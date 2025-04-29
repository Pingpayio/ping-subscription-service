import { Hono } from "hono";
import { contractCall, contractView } from "@neardefi/shade-agent-js";
import { schedulerService } from "../services/scheduler.js";

// Create router instance
const router = new Hono();

/**
 * Create a new subscription
 */
router.post("/create", async (c) => {
  try {
    const { merchantId, amount, frequency, maxPayments, tokenAddress } =
      await c.req.json();

    const result = await contractCall({
      methodName: "create_subscription",
      args: {
        merchant_id: merchantId,
        amount,
        frequency,
        max_payments: maxPayments,
        token_address: tokenAddress || null,
      },
    });

    return c.json({
      success: true,
      subscriptionId: result.subscription_id,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

/**
 * Register a key for a subscription
 */
router.post("/register-key", async (c) => {
  try {
    const { subscriptionId, publicKey } = await c.req.json();

    if (!subscriptionId || !publicKey) {
      return c.json({ error: "Missing required parameters" }, 400);
    }

    await contractCall({
      methodName: "register_subscription_key",
      args: {
        subscription_id: subscriptionId,
        public_key: publicKey,
      },
    });

    return c.json({
      success: true,
      message: "Subscription key registered",
    });
  } catch (error) {
    console.error("Error registering subscription key:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

/**
 * Get a subscription by ID
 */
router.get("/:subscriptionId", async (c) => {
  try {
    const subscriptionId = c.req.param("subscriptionId");
    const subscription = await contractView({
      methodName: "get_subscription",
      args: { subscription_id: subscriptionId },
    });

    return c.json({ subscription });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

/**
 * List subscriptions for an account
 */
router.get("/list/:accountId", async (c) => {
  try {
    const accountId = c.req.param("accountId");
    const subscriptions = await contractView({
      methodName: "get_user_subscriptions",
      args: { account_id: accountId },
    });

    return c.json({ subscriptions });
  } catch (error) {
    console.error("Error listing subscriptions:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

/**
 * Pause a subscription
 */
router.post("/:subscriptionId/pause", async (c) => {
  try {
    const subscriptionId = c.req.param("subscriptionId");

    // Pause subscription in contract
    await contractCall({
      methodName: "pause_subscription",
      args: { subscription_id: subscriptionId },
    });

    // Find and pause scheduler job
    const jobId =
      await schedulerService.findJobBySubscriptionId(subscriptionId);
    if (jobId) {
      await schedulerService.updateJobStatus(jobId, "inactive");
    }

    return c.json({ success: true, message: "Subscription paused" });
  } catch (error) {
    console.error("Error pausing subscription:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

/**
 * Resume a subscription
 */
router.post("/:subscriptionId/resume", async (c) => {
  try {
    const subscriptionId = c.req.param("subscriptionId");

    // Resume subscription in contract
    await contractCall({
      methodName: "resume_subscription",
      args: { subscription_id: subscriptionId },
    });

    // Find and resume scheduler job
    const jobId =
      await schedulerService.findJobBySubscriptionId(subscriptionId);
    if (jobId) {
      await schedulerService.updateJobStatus(jobId, "active");
    }

    return c.json({ success: true, message: "Subscription resumed" });
  } catch (error) {
    console.error("Error resuming subscription:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

/**
 * Cancel a subscription
 */
router.post("/:subscriptionId/cancel", async (c) => {
  try {
    const subscriptionId = c.req.param("subscriptionId");

    // Cancel subscription in contract
    await contractCall({
      methodName: "cancel_subscription",
      args: { subscription_id: subscriptionId },
    });

    // Find and delete scheduler job
    const jobId =
      await schedulerService.findJobBySubscriptionId(subscriptionId);
    if (jobId) {
      await schedulerService.deleteJob(jobId);
    }

    return c.json({ success: true, message: "Subscription canceled" });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default router;
