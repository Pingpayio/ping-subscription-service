import 'dotenv/config';
import { contractCall, contractView } from '../../utils/near-provider';
import { shadeAgent } from '../../utils/shade-agent';

export const dynamic = 'force-dynamic';

/**
 * API endpoint for subscription management
 * Handles:
 * - Creating subscriptions
 * - Registering keys for subscriptions
 * - Getting subscription details
 * - Managing subscriptions (pause, resume, cancel)
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, ...params } = req.body;

    switch (action) {
      case 'create':
        return await handleCreateSubscription(params, res);
      case 'register_key':
        return await handleRegisterKey(params, res);
      case 'get':
        return await handleGetSubscription(params, res);
      case 'get_user_subscriptions':
        return await handleGetUserSubscriptions(params, res);
      case 'pause':
        return await handlePauseSubscription(params, res);
      case 'resume':
        return await handleResumeSubscription(params, res);
      case 'cancel':
        return await handleCancelSubscription(params, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error handling subscription request:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle creating a new subscription
 */
async function handleCreateSubscription(params, res) {
  const {
    merchant_id,
    amount,
    frequency,
    payment_method,
    max_payments,
    end_date,
    account_id,
  } = params;

  try {
    // Validate required parameters
    if (!merchant_id || !amount || !frequency || !payment_method) {
      return res.status(400).json({
        error: 'Missing required parameters: merchant_id, amount, frequency, payment_method',
      });
    }

    // Create subscription
    const result = await contractCall({
      accountId: account_id,
      methodName: 'create_subscription',
      args: {
        merchant_id,
        amount,
        frequency,
        payment_method,
        max_payments,
        end_date,
      },
    });

    return res.status(200).json({
      success: true,
      subscription_id: result,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle registering a key for a subscription
 */
async function handleRegisterKey(params, res) {
  const { subscription_id, account_id, seed } = params;

  try {
    // Validate required parameters
    if (!subscription_id) {
      return res.status(400).json({
        error: 'Missing required parameter: subscription_id',
      });
    }

    // Initialize the shade agent if needed
    if (!shadeAgent.isInitialized) {
      await shadeAgent.initialize();
      shadeAgent.isInitialized = true;
    }

    // Generate a key pair for the subscription
    const keyPair = await shadeAgent.generateKeyPair(subscription_id, seed);

    // Register the key with the contract
    await contractCall({
      accountId: account_id,
      methodName: 'register_subscription_key',
      args: {
        public_key: keyPair.publicKey,
        subscription_id,
      },
    });

    return res.status(200).json({
      success: true,
      subscription_id,
      public_key: keyPair.publicKey,
    });
  } catch (error) {
    console.error('Error registering key for subscription:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle getting subscription details
 */
async function handleGetSubscription(params, res) {
  const { subscription_id } = params;

  try {
    // Validate required parameters
    if (!subscription_id) {
      return res.status(400).json({
        error: 'Missing required parameter: subscription_id',
      });
    }

    // Get subscription details
    const subscription = await contractView({
      methodName: 'get_subscription',
      args: { subscription_id },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle getting all subscriptions for a user
 */
async function handleGetUserSubscriptions(params, res) {
  const { user_id } = params;

  try {
    // Validate required parameters
    if (!user_id) {
      return res.status(400).json({
        error: 'Missing required parameter: user_id',
      });
    }

    // Get user subscriptions
    const subscriptions = await contractView({
      methodName: 'get_user_subscriptions',
      args: { user_id },
    });

    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle pausing a subscription
 */
async function handlePauseSubscription(params, res) {
  const { subscription_id, account_id } = params;

  try {
    // Validate required parameters
    if (!subscription_id) {
      return res.status(400).json({
        error: 'Missing required parameter: subscription_id',
      });
    }

    // Pause subscription
    await contractCall({
      accountId: account_id,
      methodName: 'pause_subscription',
      args: { subscription_id },
    });

    return res.status(200).json({
      success: true,
      subscription_id,
      status: 'paused',
    });
  } catch (error) {
    console.error('Error pausing subscription:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle resuming a subscription
 */
async function handleResumeSubscription(params, res) {
  const { subscription_id, account_id } = params;

  try {
    // Validate required parameters
    if (!subscription_id) {
      return res.status(400).json({
        error: 'Missing required parameter: subscription_id',
      });
    }

    // Resume subscription
    await contractCall({
      accountId: account_id,
      methodName: 'resume_subscription',
      args: { subscription_id },
    });

    return res.status(200).json({
      success: true,
      subscription_id,
      status: 'active',
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle canceling a subscription
 */
async function handleCancelSubscription(params, res) {
  const { subscription_id, account_id } = params;

  try {
    // Validate required parameters
    if (!subscription_id) {
      return res.status(400).json({
        error: 'Missing required parameter: subscription_id',
      });
    }

    // Cancel subscription
    await contractCall({
      accountId: account_id,
      methodName: 'cancel_subscription',
      args: { subscription_id },
    });

    return res.status(200).json({
      success: true,
      subscription_id,
      status: 'canceled',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ error: error.message });
  }
}
