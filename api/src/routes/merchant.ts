import { Hono } from 'hono';
import { contractView } from '@neardefi/shade-agent-js';

// Create router instance
const router = new Hono();

/**
 * List all merchants
 */
router.get('/', async (c) => {
  try {
    const merchants = await contractView({
      methodName: 'get_merchants',
      args: {},
    });

    return c.json({ merchants });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default router;
