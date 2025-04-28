import { Hono } from 'hono';
import { schedulerService } from '../services/scheduler.js';
import { agentService } from '../services/agent.js';

// Create router instance
const router = new Hono();

/**
 * Endpoint for the scheduler to trigger subscription payments
 */
router.post('/trigger-payment', async (c) => {
  try {
    const { subscription_id } = await c.req.json();

    if (!subscription_id) {
      return c.json({ error: 'subscription_id is required' }, 400);
    }

    await agentService.processPayment(subscription_id);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error processing triggered payment:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Create a scheduler job for a subscription
 */
router.post('/jobs', async (c) => {
  try {
    const { subscription_id, frequency, interval } = await c.req.json();

    if (!subscription_id || !frequency || !interval) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }

    const jobId = await schedulerService.createSubscriptionJob(
      subscription_id,
      frequency,
      interval
    );

    return c.json({ success: true, job_id: jobId });
  } catch (error) {
    console.error('Error creating scheduler job:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Update a scheduler job's status
 */
router.put('/jobs/:jobId', async (c) => {
  try {
    const jobId = c.req.param('jobId');
    const { status } = await c.req.json();

    if (!status || !['active', 'inactive'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    await schedulerService.updateJobStatus(jobId, status);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating job status:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Delete a scheduler job
 */
router.delete('/jobs/:jobId', async (c) => {
  try {
    const jobId = c.req.param('jobId');
    await schedulerService.deleteJob(jobId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default router;
