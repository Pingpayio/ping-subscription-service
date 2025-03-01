import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

/**
 * MonitoringControl component for controlling the subscription monitoring service
 */
export default function MonitoringControl() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [interval, setInterval] = useState(60000); // Default interval: 1 minute

  // Fetch monitoring status on component mount
  useEffect(() => {
    fetchStatus();
    
    // Set up polling for status updates
    const statusInterval = setInterval(fetchStatus, 10000); // Poll every 10 seconds
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  // Fetch monitoring status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'status',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsMonitoring(data.isMonitoring);
        setProcessingQueue(data.processingQueue || []);
      }
    } catch (error) {
      console.error('Error fetching monitoring status:', error);
    }
  };

  // Start monitoring
  const startMonitoring = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          interval: parseInt(interval),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsMonitoring(data.isMonitoring);
        setMessage('Monitoring service started successfully');
      } else {
        setError(data.error || 'Failed to start monitoring service');
      }
    } catch (error) {
      setError('Error starting monitoring service: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'stop',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsMonitoring(data.isMonitoring);
        setMessage('Monitoring service stopped successfully');
      } else {
        setError(data.error || 'Failed to stop monitoring service');
      }
    } catch (error) {
      setError('Error stopping monitoring service: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle interval input change
  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
  };

  return (
    <div className={styles.monitoringControl}>
      <h2>Subscription Monitoring Control</h2>
      
      {/* Error and message display */}
      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}
      
      {/* Monitoring status */}
      <div className={styles.card}>
        <h3>Monitoring Status</h3>
        <p>
          <strong>Status:</strong>{' '}
          <span className={isMonitoring ? styles.statusActive : styles.statusPaused}>
            {isMonitoring ? 'Running' : 'Stopped'}
          </span>
        </p>
        
        {/* Monitoring controls */}
        <div className={styles.monitoringControls}>
          {!isMonitoring ? (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="interval">Check Interval (ms):</label>
                <input
                  type="number"
                  id="interval"
                  value={interval}
                  onChange={handleIntervalChange}
                  min="5000"
                  step="1000"
                />
                <span className={styles.smallText}>Minimum: 5000ms (5 seconds)</span>
              </div>
              
              <button
                className={styles.btnResume}
                onClick={startMonitoring}
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Start Monitoring'}
              </button>
            </>
          ) : (
            <button
              className={styles.btnPause}
              onClick={stopMonitoring}
              disabled={loading}
            >
              {loading ? 'Stopping...' : 'Stop Monitoring'}
            </button>
          )}
        </div>
      </div>
      
      {/* Processing queue */}
      <div className={styles.card}>
        <h3>Processing Queue</h3>
        
        {processingQueue.length === 0 ? (
          <p>No subscriptions are currently being processed.</p>
        ) : (
          <div className={styles.queueList}>
            <table className={styles.queueTable}>
              <thead>
                <tr>
                  <th>Subscription ID</th>
                  <th>Status</th>
                  <th>Retry Count</th>
                </tr>
              </thead>
              <tbody>
                {processingQueue.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <span className={
                        item.status === 'processing' ? styles.statusActive :
                        item.status === 'retrying' ? styles.statusPaused :
                        styles.statusCanceled
                      }>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.retryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <button
          className={styles.btn}
          onClick={fetchStatus}
          disabled={loading}
          style={{ marginTop: '1rem' }}
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}
