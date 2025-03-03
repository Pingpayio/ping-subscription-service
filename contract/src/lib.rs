use near_sdk::{
    bs58, env,
    json_types::U128,
    log, near, require, serde_json,
    store::{IterableMap, IterableSet, LookupMap},
    AccountId, Gas, NearToken, PanicOnDefault, Promise,
};

pub mod collateral;
pub mod models;
pub mod utils;

use hex::decode;
use models::{
    PaymentMethod, PaymentResult, Subscription, SubscriptionFrequency, SubscriptionId,
    SubscriptionStatus, Worker,
};

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub approved_codehashes: IterableSet<String>,
    pub worker_by_account_id: IterableMap<AccountId, Worker>,

    // Subscription-related state
    pub subscriptions: IterableMap<SubscriptionId, Subscription>,
    pub subscription_keys: LookupMap<String, SubscriptionId>, // PublicKey -> SubscriptionId
    pub merchants: IterableSet<AccountId>,
}

#[near]
impl Contract {
    #[init]
    #[private]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            approved_codehashes: IterableSet::new(b"a"),
            worker_by_account_id: IterableMap::new(b"b"),

            // Initialize subscription-related state
            subscriptions: IterableMap::new(b"c"),
            subscription_keys: LookupMap::new(b"d"),
            merchants: IterableSet::new(b"g"),
        }
    }

    // HELPER METHODS

    // Require owner
    pub fn require_owner(&self) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Only owner can call this method"
        );
    }

    // ADMIN METHODS

    /// Registers a merchant
    pub fn register_merchant(&mut self, merchant_id: AccountId) {
        self.require_owner(); // We could maybe extend this to the worker as well
        self.merchants.insert(merchant_id.clone());
        log!("Merchant registered: {}", merchant_id);
    }

    /// Gets all registered merchants
    pub fn get_merchants(&self) -> Vec<AccountId> {
        self.merchants.iter().map(|id| id.clone()).collect()
    }

    // WORKER METHODS
    pub fn require_worker(&self, codehash: String) {
        let worker = self
            .worker_by_account_id
            .get(&env::predecessor_account_id())
            .unwrap()
            .to_owned();

        require!(
            worker.codehash == codehash,
            "Worker not verified for this codehash"
        );
    }

    pub fn is_verified_by_codehash(&self, codehash: String) {
        self.require_worker(codehash);
        log!("The agent abides.");
    }

    pub fn approve_codehash(&mut self, codehash: String) {
        self.require_owner();
        self.approved_codehashes.insert(codehash);
        log!("Codehash approved");
    }

    pub fn is_verified_by_approved_codehash(&self) -> bool {
        let worker = self.get_worker(env::predecessor_account_id());
        require!(
            self.approved_codehashes.contains(&worker.codehash),
            "Worker not approved"
        );
        true
    }

    pub fn register_worker(
        &mut self,
        quote_hex: String,
        collateral: String,
        checksum: String,
        codehash: String,
    ) -> bool {
        let collateral = collateral::get_collateral(collateral);
        let quote = decode(quote_hex).unwrap();
        let now = env::block_timestamp() / 1000000000;
        let result = dcap_qvl::verify::verify(&quote, &collateral, now);

        if result.ok().is_some() {
            let predecessor = env::predecessor_account_id();
            self.worker_by_account_id
                .insert(predecessor, Worker { checksum, codehash });
            log!("Worker registered successfully");
            return true;
        }
        log!("Worker registration failed");
        false
    }

    pub fn get_worker(&self, account_id: AccountId) -> Worker {
        self.worker_by_account_id
            .get(&account_id)
            .unwrap_or_else(|| panic!("Worker not found for account: {}", account_id))
            .to_owned()
    }

    // SUBSCRIPTION METHODS

    /// Creates a new subscription
    pub fn create_subscription( // can be called directly by user
        &mut self,
        merchant_id: AccountId,
        amount: U128,
        frequency: SubscriptionFrequency,
        payment_method: PaymentMethod,
        max_payments: Option<u32>,
        end_date: Option<u64>,
    ) -> SubscriptionId {
        // Verify merchant is registered
        require!(
            self.merchants.contains(&merchant_id),
            "Merchant not registered"
        );

        let user_id = env::predecessor_account_id();
        let now = env::block_timestamp() / 1000000000;

        // Generate subscription ID
        let subscription_id = format!("sub-{}-{}", user_id, now);

        // Calculate next payment date based on frequency
        let next_payment_date = match frequency {
            SubscriptionFrequency::Daily => now + 86400, // 1 day in seconds
            SubscriptionFrequency::Weekly => now + 604800, // 1 week in seconds
            SubscriptionFrequency::Monthly => now + 2592000, // 30 days in seconds
            SubscriptionFrequency::Quarterly => now + 7776000, // 90 days in seconds
            SubscriptionFrequency::Yearly => now + 31536000, // 365 days in seconds
        };

        // Create subscription (TODO: verify valid)
        let subscription = Subscription {
            id: subscription_id.clone(),
            user_id: user_id.clone(),
            merchant_id: merchant_id.clone(),
            amount,
            frequency,
            next_payment_date,
            status: SubscriptionStatus::Active,
            created_at: now,
            updated_at: now,
            payment_method,
            max_payments,
            payments_made: 0,
            end_date,
        };

        // Store subscription
        self.subscriptions
            .insert(subscription_id.clone(), subscription);

        log!("Subscription created: {}", subscription_id);

        subscription_id
    }

    /// Registers a function call access key for a subscription
    pub fn register_subscription_key(
        &mut self,
        public_key: String, // this is used later to generate key pair
        subscription_id: SubscriptionId,
    ) {
        let user_id = env::predecessor_account_id();

        // Verify subscription exists and belongs to user
        let subscription = self
            .subscriptions
            .get(&subscription_id)
            .expect("Subscription not found");
        require!(
            subscription.user_id == user_id,
            "Not authorized to register key for this subscription"
        );

        // Register key
        self.subscription_keys
            .insert(public_key, subscription_id.clone());

        log!("Key registered for subscription: {}", subscription_id);
    }

    /// Cancels a subscription
    pub fn cancel_subscription(&mut self, subscription_id: SubscriptionId) {
        let user_id = env::predecessor_account_id();

        // Verify subscription exists and belongs to user
        let mut subscription = self
            .subscriptions
            .get(&subscription_id)
            .expect("Subscription not found")
            .clone();
        require!(
            subscription.user_id == user_id,
            "Not authorized to cancel this subscription"
        );

        // Update subscription status
        subscription.status = SubscriptionStatus::Canceled;
        subscription.updated_at = env::block_timestamp() / 1000000000;

        // Store updated subscription
        self.subscriptions
            .insert(subscription_id.clone(), subscription);

        log!("Subscription canceled: {}", subscription_id);
    }

    /// Pauses a subscription
    pub fn pause_subscription(&mut self, subscription_id: SubscriptionId) {
        let user_id = env::predecessor_account_id();

        // Verify subscription exists and belongs to user
        let mut subscription = self
            .subscriptions
            .get(&subscription_id)
            .expect("Subscription not found")
            .clone();
        require!(
            subscription.user_id == user_id,
            "Not authorized to pause this subscription"
        );

        // Update subscription status
        subscription.status = SubscriptionStatus::Paused;
        subscription.updated_at = env::block_timestamp() / 1000000000;

        // Store updated subscription
        self.subscriptions
            .insert(subscription_id.clone(), subscription);

        log!("Subscription paused: {}", subscription_id);
    }

    /// Resumes a paused subscription
    pub fn resume_subscription(&mut self, subscription_id: SubscriptionId) {
        let user_id = env::predecessor_account_id();

        // Verify subscription exists and belongs to user
        let mut subscription = self
            .subscriptions
            .get(&subscription_id)
            .expect("Subscription not found")
            .clone();
        require!(
            subscription.user_id == user_id,
            "Not authorized to resume this subscription"
        );
        require!(
            matches!(subscription.status, SubscriptionStatus::Paused),
            "Subscription is not paused"
        );

        // Update subscription status
        subscription.status = SubscriptionStatus::Active;
        subscription.updated_at = env::block_timestamp() / 1000000000;

        // Store updated subscription
        self.subscriptions
            .insert(subscription_id.clone(), subscription);

        log!("Subscription resumed: {}", subscription_id);
    }

    /// Gets a subscription by ID
    pub fn get_subscription(&self, subscription_id: SubscriptionId) -> Option<Subscription> {
        self.subscriptions.get(&subscription_id).cloned()
    }

    /// Gets all subscriptions for a user
    pub fn get_user_subscriptions(&self, user_id: AccountId) -> Vec<Subscription> {
        let mut subscriptions = Vec::new();

        for (_, subscription) in self.subscriptions.iter() {
            if subscription.user_id == user_id {
                subscriptions.push(subscription.clone());
            }
        }

        subscriptions
    }

    /// Gets all subscriptions for a merchant
    pub fn get_merchant_subscriptions(&self, merchant_id: AccountId) -> Vec<Subscription> {
        let mut subscriptions = Vec::new();

        for (_, subscription) in self.subscriptions.iter() {
            if subscription.merchant_id == merchant_id {
                subscriptions.push(subscription.clone());
            }
        }

        subscriptions
    }

    // HELPER METHODS FOR PAYMENTS
    
    /// Updates a subscription after a successful payment
    /// Returns the updated subscription
    fn update_subscription_after_payment(
        &mut self,
        subscription: &Subscription,
        subscription_id: &SubscriptionId,
        now: u64,
    ) -> Subscription {
        // Clone frequency and calculate next payment date
        let frequency = subscription.frequency.clone();
        let next_payment_date = match frequency {
            SubscriptionFrequency::Daily => now + 86400,
            SubscriptionFrequency::Weekly => now + 604800,
            SubscriptionFrequency::Monthly => now + 2592000,
            SubscriptionFrequency::Quarterly => now + 7776000,
            SubscriptionFrequency::Yearly => now + 31536000,
        };
        
        // Create a new subscription with updated values
        let mut updated_subscription = subscription.clone();
        updated_subscription.payments_made += 1;
        updated_subscription.next_payment_date = next_payment_date;
        updated_subscription.updated_at = now;

        // Store updated subscription
        self.subscriptions
            .insert(subscription_id.clone(), updated_subscription.clone());
            
        updated_subscription
    }
    
    // PAYMENT METHODS

    /// Processes a payment for a subscription
    /// This is called by the API with the generated key pair for stored public key
    /// And private key stored in API
    pub fn process_payment(&mut self, subscription_id: SubscriptionId) -> PaymentResult {
        let now = env::block_timestamp() / 1000000000;

        // Verify caller is an approved worker
        require!(
            self.is_verified_by_approved_codehash(),
            "Not an approved worker"
        );

        // Verify key is authorized for this subscription
        let public_key = env::signer_account_pk();
        let public_key_str = bs58::encode(public_key.as_bytes()).into_string();
        let authorized_subscription_id = self.subscription_keys.get(&public_key_str);

        match authorized_subscription_id {
            Some(id) if *id == subscription_id => {
                // Key is authorized, proceed with payment
                let subscription_clone: Subscription = self
                    .subscriptions
                    .get(&subscription_id)
                    .expect("Subscription not found")
                    .clone();

                let mut subscription = subscription_clone.clone(); // mutable clone

                // Verify subscription is active
                if !matches!(subscription.status, SubscriptionStatus::Active) {
                    // Clone the values we need
                    let amount = subscription.amount.clone();
                    let status = format!("{:?}", subscription.status);

                    return PaymentResult {
                        success: false,
                        subscription_id,
                        amount,
                        timestamp: now,
                        error: Some(format!("Subscription is not active: {}", status)),
                    };
                }

                // Verify payment is due
                if subscription.next_payment_date > now {
                    // Clone the values we need
                    let amount = subscription.amount.clone();

                    return PaymentResult {
                        success: false,
                        subscription_id,
                        amount,
                        timestamp: now,
                        error: Some("Payment is not due yet".to_string()),
                    };
                }

                // Verify max payments limit
                if let Some(max) = subscription.max_payments {
                    if subscription.payments_made >= max {
                        subscription.status = SubscriptionStatus::Canceled;
                        self.subscriptions
                            .insert(subscription_id.clone(), subscription);

                        return PaymentResult {
                            success: false,
                            subscription_id,
                            amount: subscription_clone.amount,
                            timestamp: now,
                            error: Some("Maximum number of payments reached".to_string()),
                        };
                    }
                }

                // Verify end date
                if let Some(end_date) = subscription.end_date {
                    if now >= end_date {
                        subscription.status = SubscriptionStatus::Canceled;
                        self.subscriptions
                            .insert(subscription_id.clone(), subscription);

                        return PaymentResult {
                            success: false,
                            subscription_id,
                            amount: subscription_clone.amount,
                            timestamp: now,
                            error: Some("Subscription end date reached".to_string()),
                        };
                    }
                }

                let merchant_id = subscription_clone.merchant_id.clone();
                let amount = subscription_clone.amount.0;
                let user_id = subscription_clone.user_id.clone();

                // Process payment based on payment method
                match subscription.payment_method {
                    PaymentMethod::Near => {
                        // Transfer NEAR from user to merchant
                        Promise::new(merchant_id.clone())
                            .transfer(NearToken::from_yoctonear(amount));

                        log!(
                            "Transferring {} NEAR from {} to {}",
                            amount,
                            user_id,
                            merchant_id
                        );

                        // Update subscription using helper method
                        self.update_subscription_after_payment(
                            &subscription_clone,
                            &subscription_id,
                            now
                        );

                        PaymentResult {
                            success: true,
                            subscription_id,
                            amount: subscription_clone.amount,
                            timestamp: now,
                            error: None,
                        }
                    }
                    PaymentMethod::Ft { token_id } => {
                        // Prepare the FT transfer arguments
                        let ft_transfer_args = serde_json::json!({
                            "receiver_id": merchant_id.to_string(),
                            "amount": amount.to_string(),
                            "memo": format!("Subscription payment: {}", subscription_id)
                        })
                        .to_string()
                        .into_bytes();

                        // Make the cross-contract call
                        Promise::new(token_id.clone()).function_call(
                            "ft_transfer".to_string(),
                            ft_transfer_args,
                            NearToken::from_yoctonear(1), // 1 yoctoNEAR deposit
                            Gas::from_tgas(10), // Allocate gas for the cross-contract call
                        );

                        log!(
                            "Transferring {} tokens from {} to {} via {}",
                            amount,
                            user_id,
                            merchant_id,
                            token_id
                        );

                        // Update subscription
                        self.update_subscription_after_payment(
                            &subscription_clone,
                            &subscription_id,
                            now
                        );

                        PaymentResult {
                            success: true,
                            subscription_id,
                            amount: subscription_clone.amount,
                            timestamp: now,
                            error: None,
                        }
                    }
                }
            }
            _ => {
                // Key is not authorized
                PaymentResult {
                    success: false,
                    subscription_id,
                    amount: U128(0),
                    timestamp: now,
                    error: Some("Key is not authorized for this subscription".to_string()),
                }
            }
        }
    }

    /// Gets a list of subscriptions that are due for payment
    pub fn get_due_subscriptions(&self, limit: u64) -> Vec<Subscription> {
        let now = env::block_timestamp() / 1000000000;
        let mut due_subscriptions = Vec::new();
        let mut count = 0;

        // Verify caller is an approved worker
        require!(
            self.is_verified_by_approved_codehash(), // idk if we need this to be approved by codehash tho
            "Not an approved worker"
        );

        // Iterate through subscriptions to find due payments
        for (_, subscription) in self.subscriptions.iter() {
            if count >= limit {
                break;
            }

            if matches!(subscription.status, SubscriptionStatus::Active)
                && subscription.next_payment_date <= now
            {
                due_subscriptions.push(subscription.clone());
                count += 1;
            }
        }

        due_subscriptions
    }
}
