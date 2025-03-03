/**
 * Subscription status enum
 */
export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  CANCELED = "CANCELED",
  FAILED = "FAILED",
}

/**
 * Subscription frequency enum
 */
export enum SubscriptionFrequency {
  MINUTE = "MINUTE",
  HOURLY = "HOURLY",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  NEAR = "NEAR",
}

/**
 * Subscription interface
 */
export interface Subscription {
  id: string;
  userId: string;
  merchantId: string;
  amount: string;
  frequency: SubscriptionFrequency;
  nextPaymentDate: string; // ISO date string
  status: SubscriptionStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  paymentMethod: PaymentMethod;
  maxPayments?: number;
  paymentsMade: number;
  endDate?: string; // ISO date string
  tokenAddress?: string;
}

/**
 * Worker status interface
 */
export interface WorkerStatus {
  accountId?: string;
  registered?: boolean;
  verified?: boolean;
}

/**
 * Merchant interface
 */
export interface Merchant {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  active: boolean;
}

/**
 * Payment result interface
 */
export interface PaymentResult {
  success: boolean;
  error?: string;
  transactionHash?: string;
  amount?: string;
  timestamp?: string; // ISO date string
}

/**
 * Monitoring status interface
 */
export interface MonitoringStatus {
  isMonitoring: boolean;
  processingQueue?: {
    id: string;
    status: "PROCESSING" | "RETRYING";
    retryCount: number;
  }[];
}
