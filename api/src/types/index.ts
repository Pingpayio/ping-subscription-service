export interface SchedulerJobConfig {
  name: string;
  description: string;
  type: 'http';
  target: string;
  payload: {
    subscription_id: string;
    [key: string]: any;
  };
  schedule_type: 'recurring' | 'specific_time' | 'cron';
  interval?: string;
  interval_value?: number;
  specific_time?: string;
  cron_expression?: string;
}

export interface WorkerStatus {
  accountId?: string;
  registered?: boolean;
  verified?: boolean;
  error?: string;
}

export interface Subscription {
  id: string;
  merchant_id: string;
  user_id: string;
  amount: string;
  frequency: string;
  max_payments: number;
  payments_made: number;
  next_payment_date: string;
  status: 'active' | 'paused' | 'cancelled';
  token_address?: string;
  created_at: string;
  updated_at: string;
}
