import { Hono } from 'hono';
import { agentService } from '../services/agent.js';

// Create router instance
const router = new Hono();

/**
 * Store a subscription key in the TEE
 */
router.post('/keys', async (c) => {
  try {
    const { subscription_id, private_key, public_key } = await c.req.json();

    if (!subscription_id || !private_key || !public_key) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }

    const success = await agentService.storeSubscriptionKey(
      subscription_id,
      private_key,
      public_key
    );

    return c.json({
      success,
      message: success ? 'Key stored successfully' : 'Failed to store key'
    });
  } catch (error) {
    console.error('Error storing key:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Verify the agent's TEE attestation
 */
router.get('/verify', async (c) => {
  try {
    const verified = await agentService.verifyAttestation();
    return c.json({ verified });
  } catch (error) {
    console.error('Error verifying attestation:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default router;
