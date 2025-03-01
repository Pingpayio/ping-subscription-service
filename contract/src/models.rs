use near_sdk::{
    AccountId,
    json_types::U128,
    near,
};

pub type SubscriptionId = String;

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug)]
pub struct Worker {
    pub checksum: String,
    pub codehash: String,
}

#[near(serializers = [json, borsh])]
#[derive(Debug, Clone)]
pub enum SubscriptionStatus {
    Active,
    Paused,
    Canceled,
    Failed,
}

#[near(serializers = [json, borsh])]
#[derive(Debug, Clone)]
pub enum SubscriptionFrequency {
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Yearly,
}

#[near(serializers = [json, borsh])]
#[derive(Debug, Clone)]
pub enum PaymentMethod {
    Near,
    Ft { token_id: AccountId },
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Subscription {
    pub id: SubscriptionId,
    pub user_id: AccountId,
    pub merchant_id: AccountId,
    pub amount: U128,
    pub frequency: SubscriptionFrequency,
    pub next_payment_date: u64,
    pub status: SubscriptionStatus,
    pub created_at: u64,
    pub updated_at: u64,
    pub payment_method: PaymentMethod,
    pub max_payments: Option<u32>,
    pub payments_made: u32,
    pub end_date: Option<u64>,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct PaymentResult {
    pub success: bool,
    pub subscription_id: SubscriptionId,
    pub amount: U128,
    pub timestamp: u64,
    pub error: Option<String>,
}
