import 'dotenv/config';
import { shadeAgent } from '../../utils/shade-agent';

export const dynamic = 'force-dynamic';

/**
 * API endpoint for controlling the subscription monitoring service
 * Handles:
 * - Starting the monitoring service
 * - Stopping the monitoring service
 * - Getting the monitoring status
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, interval } = req.body;

    switch (action) {
      case 'start':
        return await handleStartMonitoring(interval, res);
      case 'stop':
        return await handleStopMonitoring(res);
      case 'status':
        return await handleGetStatus(res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error handling monitoring request:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle starting the monitoring service
 */
async function handleStartMonitoring(interval, res) {
  try {
    // Initialize the shade agent if needed
    if (!shadeAgent.isInitialized) {
      await shadeAgent.initialize();
      shadeAgent.isInitialized = true;
    }

    // Start monitoring with the specified interval (or default)
    await shadeAgent.startMonitoring(interval || 60000);

    return res.status(200).json({
      success: true,
      message: 'Monitoring service started',
      isMonitoring: shadeAgent.isMonitoring,
    });
  } catch (error) {
    console.error('Error starting monitoring service:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle stopping the monitoring service
 */
async function handleStopMonitoring(res) {
  try {
    // Stop monitoring
    shadeAgent.stopMonitoring();

    return res.status(200).json({
      success: true,
      message: 'Monitoring service stopped',
      isMonitoring: shadeAgent.isMonitoring,
    });
  } catch (error) {
    console.error('Error stopping monitoring service:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle getting the monitoring status
 */
async function handleGetStatus(res) {
  try {
    return res.status(200).json({
      success: true,
      isMonitoring: shadeAgent.isMonitoring,
      processingQueue: Array.from(shadeAgent.processingQueue.entries()).map(([id, status]) => ({
        id,
        status: status.status,
        retryCount: status.retryCount,
      })),
    });
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    return res.status(500).json({ error: error.message });
  }
}
