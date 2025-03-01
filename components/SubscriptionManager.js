import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

/**
 * SubscriptionManager component for creating and managing subscriptions
 */
export default function SubscriptionManager({ accountId }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [merchants, setMerchants] = useState([]);
  
  // Form state for creating a new subscription
  const [formData, setFormData] = useState({
    merchant_id: '',
    amount: '',
    frequency: 'Monthly',
    payment_method: { Near: null },
    max_payments: '',
    end_date: '',
  });

  // Fetch user's subscriptions and available merchants on component mount
  useEffect(() => {
    if (accountId) {
      fetchUserSubscriptions();
      fetchMerchants();
    }
  }, [accountId]);

  // Fetch user's subscriptions
  const fetchUserSubscriptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_user_subscriptions',
          user_id: accountId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubscriptions(data.subscriptions);
      } else {
        setError(data.error || 'Failed to fetch subscriptions');
      }
    } catch (error) {
      setError('Error fetching subscriptions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available merchants
  const fetchMerchants = async () => {
    try {
      const response = await fetch('/api/merchants', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMerchants(data.merchants);
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'payment_method') {
      // Handle payment method selection
      if (value === 'Near') {
        setFormData({
          ...formData,
          payment_method: { Near: null },
        });
      } else {
        setFormData({
          ...formData,
          payment_method: { Ft: { token_id: value } },
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission to create a new subscription
  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      // Validate form data
      if (!formData.merchant_id || !formData.amount || !formData.frequency) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Convert amount to U128 format (string)
      const amountInYoctoNear = (parseFloat(formData.amount) * 1e24).toString();
      
      // Create subscription
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          account_id: accountId,
          merchant_id: formData.merchant_id,
          amount: amountInYoctoNear,
          frequency: formData.frequency,
          payment_method: formData.payment_method,
          max_payments: formData.max_payments ? parseInt(formData.max_payments) : undefined,
          end_date: formData.end_date ? new Date(formData.end_date).getTime() / 1000 : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`Subscription created successfully! ID: ${data.subscription_id}`);
        
        // Register a key for the subscription
        await registerSubscriptionKey(data.subscription_id);
        
        // Reset form
        setFormData({
          merchant_id: '',
          amount: '',
          frequency: 'Monthly',
          payment_method: { Near: null },
          max_payments: '',
          end_date: '',
        });
        
        // Refresh subscriptions
        fetchUserSubscriptions();
      } else {
        setError(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      setError('Error creating subscription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Register a key for a subscription
  const registerSubscriptionKey = async (subscriptionId) => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register_key',
          account_id: accountId,
          subscription_id: subscriptionId,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to register key for subscription');
      }
    } catch (error) {
      console.error('Error registering key for subscription:', error);
      setError('Error registering key for subscription: ' + error.message);
    }
  };

  // Handle pausing a subscription
  const handlePauseSubscription = async (subscriptionId) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'pause',
          account_id: accountId,
          subscription_id: subscriptionId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`Subscription paused successfully!`);
        fetchUserSubscriptions();
      } else {
        setError(data.error || 'Failed to pause subscription');
      }
    } catch (error) {
      setError('Error pausing subscription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle resuming a subscription
  const handleResumeSubscription = async (subscriptionId) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resume',
          account_id: accountId,
          subscription_id: subscriptionId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`Subscription resumed successfully!`);
        fetchUserSubscriptions();
      } else {
        setError(data.error || 'Failed to resume subscription');
      }
    } catch (error) {
      setError('Error resuming subscription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle canceling a subscription
  const handleCancelSubscription = async (subscriptionId) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          account_id: accountId,
          subscription_id: subscriptionId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`Subscription canceled successfully!`);
        fetchUserSubscriptions();
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      setError('Error canceling subscription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Format amount from yoctoNEAR to NEAR
  const formatAmount = (amount) => {
    return (parseInt(amount) / 1e24).toFixed(2);
  };

  // Get payment method display text
  const getPaymentMethodText = (paymentMethod) => {
    if (paymentMethod.Near !== undefined) {
      return 'NEAR';
    } else if (paymentMethod.Ft) {
      return `Token: ${paymentMethod.Ft.token_id}`;
    }
    return 'Unknown';
  };

  // Get subscription status class for styling
  const getStatusClass = (status) => {
    switch (status) {
      case 'Active':
        return styles.statusActive;
      case 'Paused':
        return styles.statusPaused;
      case 'Canceled':
        return styles.statusCanceled;
      default:
        return '';
    }
  };

  return (
    <div className={styles.subscriptionManager}>
      <h2>Subscription Manager</h2>
      
      {/* Error and message display */}
      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}
      
      {/* Create subscription form */}
      <div className={styles.card}>
        <h3>Create New Subscription</h3>
        <form onSubmit={handleCreateSubscription}>
          <div className={styles.formGroup}>
            <label htmlFor="merchant_id">Merchant:</label>
            <select
              id="merchant_id"
              name="merchant_id"
              value={formData.merchant_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a merchant</option>
              {merchants.map((merchant) => (
                <option key={merchant} value={merchant}>
                  {merchant}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="amount">Amount (NEAR):</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              step="0.01"
              min="0.01"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="frequency">Frequency:</label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              required
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="payment_method">Payment Method:</label>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method.Near !== undefined ? 'Near' : formData.payment_method.Ft?.token_id || ''}
              onChange={handleInputChange}
              required
            >
              <option value="Near">NEAR</option>
              {/* Add token options here if needed */}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="max_payments">Max Payments (optional):</label>
            <input
              type="number"
              id="max_payments"
              name="max_payments"
              value={formData.max_payments}
              onChange={handleInputChange}
              min="1"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="end_date">End Date (optional):</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
            />
          </div>
          
          <button
            type="submit"
            className={styles.btn}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Subscription'}
          </button>
        </form>
      </div>
      
      {/* Subscriptions list */}
      <div className={styles.card}>
        <h3>Your Subscriptions</h3>
        {loading && <p>Loading subscriptions...</p>}
        
        {!loading && subscriptions.length === 0 && (
          <p>You don't have any subscriptions yet.</p>
        )}
        
        {!loading && subscriptions.length > 0 && (
          <div className={styles.subscriptionsList}>
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className={styles.subscriptionItem}>
                <div className={styles.subscriptionHeader}>
                  <h4>Subscription ID: {subscription.id}</h4>
                  <span className={getStatusClass(subscription.status)}>
                    {subscription.status}
                  </span>
                </div>
                
                <div className={styles.subscriptionDetails}>
                  <p><strong>Merchant:</strong> {subscription.merchant_id}</p>
                  <p><strong>Amount:</strong> {formatAmount(subscription.amount)} NEAR</p>
                  <p><strong>Frequency:</strong> {subscription.frequency}</p>
                  <p><strong>Payment Method:</strong> {getPaymentMethodText(subscription.payment_method)}</p>
                  <p><strong>Next Payment:</strong> {formatDate(subscription.next_payment_date)}</p>
                  <p><strong>Created:</strong> {formatDate(subscription.created_at)}</p>
                  <p><strong>Payments Made:</strong> {subscription.payments_made}</p>
                  {subscription.max_payments && (
                    <p><strong>Max Payments:</strong> {subscription.max_payments}</p>
                  )}
                  {subscription.end_date && (
                    <p><strong>End Date:</strong> {formatDate(subscription.end_date)}</p>
                  )}
                </div>
                
                <div className={styles.subscriptionActions}>
                  {subscription.status === 'Active' && (
                    <button
                      className={styles.btnPause}
                      onClick={() => handlePauseSubscription(subscription.id)}
                      disabled={loading}
                    >
                      Pause
                    </button>
                  )}
                  
                  {subscription.status === 'Paused' && (
                    <button
                      className={styles.btnResume}
                      onClick={() => handleResumeSubscription(subscription.id)}
                      disabled={loading}
                    >
                      Resume
                    </button>
                  )}
                  
                  {(subscription.status === 'Active' || subscription.status === 'Paused') && (
                    <button
                      className={styles.btnCancel}
                      onClick={() => handleCancelSubscription(subscription.id)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          className={styles.btn}
          onClick={fetchUserSubscriptions}
          disabled={loading}
        >
          Refresh Subscriptions
        </button>
      </div>
    </div>
  );
}
