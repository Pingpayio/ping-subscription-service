# Subscription Service Architecture

## Overview

This document outlines the architecture for a blockchain-based subscription service using NEAR's Function Call Access Keys and Shade Agents running in Trusted Execution Environments (TEEs). The system enables secure, automated recurring payments without requiring users to pre-fund accounts or approve unlimited spending.

## System Components

### 1. Subscription Smart Contract

A NEAR smart contract that manages:
- Subscription creation and management
- Payment processing
- Access key registration and verification
- Merchant relationships

### 2. Shade Agent

A Worker Agent running in a TEE on Phala Cloud that:
- Monitors subscriptions for due payments
- Securely stores private keys
- Signs and submits payment transactions
- Handles payment failures and retries

### 3. User Interface

A web application that allows users to:
- Create and manage subscriptions
- View payment history
- Pause or cancel subscriptions

## Key Workflows

### Subscription Creation

```mermaid
sequenceDiagram
    participant User
    participant UI as Web Interface
    participant Wallet as NEAR Wallet
    participant TEE as Shade Agent (TEE)
    participant Contract as Subscription Contract
    
    User->>UI: Select subscription plan
    UI->>TEE: Request seed for keypair
    TEE-->>UI: Return seed
    UI->>Wallet: Request to create function call access key
    Note over UI,Wallet: Key limited to process_payment method
    Note over UI,Wallet: Key limited to maximum allowance
    Wallet-->>User: Confirm key creation
    User->>Wallet: Approve
    Wallet->>UI: Return success
    UI->>Wallet: Create subscription transaction
    Wallet-->>User: Confirm subscription creation
    User->>Wallet: Approve
    Wallet->>Contract: create_subscription(merchant, amount, frequency)
    Contract-->>Wallet: Return subscription_id
    UI->>Wallet: Register public key with subscription
    Wallet->>Contract: register_subscription_key(public_key, subscription_id)
    Contract-->>UI: Confirmation
    UI->>TEE: Register subscription_id with seed
    TEE-->>UI: Confirmation
    UI-->>User: Subscription active confirmation
```

### Payment Processing

```mermaid
sequenceDiagram
    participant TEE as Shade Agent (TEE)
    participant Contract as Subscription Contract
    participant Merchant
    
    Note over TEE: Scheduled execution
    TEE->>Contract: get_due_subscriptions()
    Contract-->>TEE: List of due subscriptions
    
    loop For each subscription
        TEE->>TEE: Retrieve/derive private key
        TEE->>TEE: Create keypair and account object
        TEE->>Contract: process_payment(subscription_id)
        Contract->>Contract: Verify key is authorized
        Contract->>Contract: Verify payment is due
        Contract->>Merchant: Transfer payment
        Contract->>Contract: Update next payment date
        Contract-->>TEE: Payment result
        TEE->>TEE: Log result and handle failures
    end
```

### Subscription Management

```mermaid
sequenceDiagram
    participant User
    participant UI as Web Interface
    participant Wallet as NEAR Wallet
    participant Contract as Subscription Contract
    
    User->>UI: Request to cancel subscription
    UI->>Wallet: Create cancel transaction
    Wallet-->>User: Confirm cancellation
    User->>Wallet: Approve
    Wallet->>Contract: cancel_subscription(subscription_id)
    Contract->>Contract: Update subscription status
    Contract-->>Wallet: Confirmation
    UI-->>User: Subscription cancelled confirmation
```

## Technical Implementation

### Smart Contract Structure

```rust
#[near(contract_state)]
pub struct SubscriptionContract {
    pub owner_id: AccountId,
    pub approved_agents: IterableSet<String>, // codehashes of approved agents
    pub subscriptions: IterableMap<SubscriptionId, Subscription>,
    pub subscription_keys: LookupMap<PublicKey, SubscriptionId>,
    pub user_subscriptions: LookupMap<AccountId, Vec<SubscriptionId>>,
    pub merchant_subscriptions: LookupMap<AccountId, Vec<SubscriptionId>>,
}

#[near(serializers = [json, borsh])]
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

pub enum SubscriptionStatus {
    Active,
    Paused,
    Canceled,
    Failed,
}

pub enum SubscriptionFrequency {
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Yearly,
}

pub enum PaymentMethod {
    Near,
    Ft { token_id: AccountId },
}
```

### Key Contract Methods

```rust
// User methods
pub fn create_subscription(&mut self, merchant_id: AccountId, amount: U128, frequency: SubscriptionFrequency, ...) -> SubscriptionId;
pub fn register_subscription_key(&mut self, public_key: String, subscription_id: SubscriptionId);
pub fn cancel_subscription(&mut self, subscription_id: SubscriptionId);
pub fn pause_subscription(&mut self, subscription_id: SubscriptionId);
pub fn resume_subscription(&mut self, subscription_id: SubscriptionId);
pub fn get_user_subscriptions(&self, user_id: AccountId) -> Vec<Subscription>;

// Payment processing methods
pub fn process_payment(&mut self, subscription_id: SubscriptionId) -> PaymentResult;
pub fn get_due_subscriptions(&self, limit: u64) -> Vec<Subscription>;

// Admin methods
pub fn register_merchant(&mut self, merchant_id: AccountId, ...);
pub fn approve_agent_codehash(&mut self, codehash: String);
```

### Shade Agent Implementation

The Shade Agent is a Worker Agent running in a TEE on Phala Cloud. It includes:

1. **Key Management Module**:
   - Securely generates and stores seeds for keypairs
   - Derives keypairs when needed for transactions
   - Implements secure key rotation if needed

2. **Subscription Monitor**:
   - Periodically checks for due subscriptions
   - Manages a queue of pending payments
   - Implements retry logic for failed payments

3. **Payment Processor**:
   - Signs and submits payment transactions
   - Verifies transaction success
   - Updates payment status

4. **Reporting Module**:
   - Logs all payment attempts
   - Generates reports for merchants
   - Provides audit trail

### Security Considerations

1. **Key Security**:
   - Private keys never leave the TEE
   - Keys are limited to specific contract methods
   - Keys have maximum allowance limits

2. **TEE Security**:
   - Remote attestation verifies TEE integrity
   - Code hash verification ensures correct execution
   - Hardware-level isolation protects sensitive data

3. **Contract Security**:
   - Access control for all methods
   - Verification of key authorization
   - Rate limiting for payment processing

4. **User Protection**:
   - Clear subscription terms
   - Easy cancellation process
   - Maximum payment limits

## Implementation Roadmap

### Phase 1: Core Infrastructure

1. **Smart Contract Development**:
   - Implement subscription data structures
   - Develop key registration system
   - Create payment processing logic
   - Build subscription management methods

2. **Shade Agent Development**:
   - Set up TEE environment on Phala Cloud
   - Implement key management system
   - Develop subscription monitoring
   - Build payment processing logic

3. **Basic UI**:
   - Create subscription creation flow
   - Implement key generation and registration
   - Develop subscription management interface

### Phase 2: Enhanced Features

1. **Token Support**:
   - Add support for NEAR tokens (NEP-141)
   - Implement token transfer logic
   - Update UI for token selection

2. **Advanced Subscription Options**:
   - Variable pricing based on usage
   - Trial periods and introductory pricing
   - Discount codes and promotions

3. **Merchant Dashboard**:
   - Subscription analytics
   - Payment reporting
   - Customer management

### Phase 3: Cross-Chain Expansion

1. **Chain Signatures Integration**:
   - Implement NEAR Chain Signatures
   - Add support for Base and other EVM chains
   - Develop cross-chain payment routing

2. **Multi-Chain UI**:
   - Update UI for multi-chain support
   - Add chain selection options
   - Implement cross-chain analytics

3. **Advanced Security Features**:
   - Key rotation mechanisms
   - Enhanced audit trails
   - Compliance reporting

## Technical Challenges and Solutions

### Challenge 1: Key Management

**Problem**: Securely generating, storing, and using private keys.

**Solution**: 
- Generate seeds within the TEE
- Derive keypairs deterministically
- Never expose private keys outside the TEE
- Implement secure storage with encryption

### Challenge 2: Payment Reliability

**Problem**: Ensuring payments are processed reliably, even with network issues.

**Solution**:
- Implement robust retry logic
- Use idempotent payment processing
- Maintain a persistent queue of pending payments
- Implement failure notification system

### Challenge 3: Scalability

**Problem**: Handling a large number of subscriptions efficiently.

**Solution**:
- Batch processing of payments
- Efficient storage design in the contract
- Optimized query methods for due subscriptions
- Horizontal scaling of Shade Agents

## Future Extensions

1. **Dynamic Pricing**:
   - Integration with external price feeds
   - Usage-based pricing models
   - Dynamic adjustments based on market conditions

2. **Advanced Payment Options**:
   - Split payments across multiple tokens
   - Automatic currency conversion
   - Payment routing optimization

3. **Integration Ecosystem**:
   - APIs for third-party integration
   - Webhook notifications
   - SDK for merchant integration

4. **Governance Features**:
   - DAO-controlled subscription service
   - Community-governed fee structure
   - Decentralized dispute resolution

## Conclusion

This architecture provides a secure, flexible foundation for a blockchain-based subscription service. By leveraging NEAR's Function Call Access Keys and the security of TEEs through Shade Agents, it offers a superior alternative to traditional subscription services with enhanced security, transparency, and user control.

The key innovations in this design are:

1. **Secure Key Management**: Using TEEs to securely manage private keys and handle payment processing
2. **Function Call Access Keys**: Leveraging NEAR's unique feature for limited, secure payment authorization
3. **Cross-Chain Potential**: Built-in support for expansion to other chains through NEAR Chain Signatures
4. **User Control**: Full transparency and control over subscription terms and payments
5. **Merchant Flexibility**: Support for various payment models and subscription types

This system demonstrates how blockchain technology, particularly when combined with TEEs and advanced key management, can create more secure, transparent, and user-friendly subscription services.
