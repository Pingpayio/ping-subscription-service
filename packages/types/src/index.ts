/**
 * Subscription status enum
 */
export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  CANCELED = "CANCELED",
  FAILED = "FAILED"
}

/**
 * Subscription frequency enum
 */
export enum SubscriptionFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY"
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  NEAR = "NEAR",
  FT = "FT"
}

/**
 * Subscription interface
 */
export interface Subscription {
  ID: string;
  USER_ID: string;
  MERCHANT_ID: string;
  AMOUNT: string;
  FREQUENCY: SubscriptionFrequency;
  NEXT_PAYMENT_DATE: number;
  STATUS: SubscriptionStatus;
  CREATED_AT: number;
  UPDATED_AT: number;
  PAYMENT_METHOD: PaymentMethod;
  MAX_PAYMENTS?: number;
  PAYMENTS_MADE: number;
  END_DATE?: number;
  TOKEN_ADDRESS?: string;
}

/**
 * Worker status interface
 */
export interface WorkerStatus {
  ACCOUNT_ID?: string;
  REGISTERED?: boolean;
  VERIFIED?: boolean;
}

/**
 * Merchant interface
 */
export interface Merchant {
  ID: string;
  NAME: string;
  OWNER_ID: string;
  CREATED_AT: number;
  UPDATED_AT: number;
  ACTIVE: boolean;
}

/**
 * Payment result interface
 */
export interface PaymentResult {
  SUCCESS: boolean;
  ERROR?: string;
  TRANSACTION_HASH?: string;
  AMOUNT?: string;
  TIMESTAMP?: number;
}

/**
 * Monitoring status interface
 */
export interface MonitoringStatus {
  IS_MONITORING: boolean;
  PROCESSING_QUEUE?: {
    ID: string;
    STATUS: "PROCESSING" | "RETRYING";
    RETRY_COUNT: number;
  }[];
}
