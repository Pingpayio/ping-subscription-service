import 'dotenv/config';
import { contractView } from '../../utils/near-provider';

export const dynamic = 'force-dynamic';

/**
 * API endpoint for fetching merchants
 * Returns a list of registered merchants from the contract
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get merchants from the contract
    const merchants = await contractView({
      methodName: 'get_merchants',
      args: {},
    });

    return res.status(200).json({
      success: true,
      merchants,
    });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return res.status(500).json({ error: error.message });
  }
}
