# Project Brief: NEAR Subscription Service

## Overview
A blockchain-based subscription service using NEAR's Function Call Access Keys and Shade Agents running in Trusted Execution Environments (TEEs). The system enables secure, automated recurring payments without requiring users to pre-fund accounts or approve unlimited spending.

## Core Requirements

1. **Subscription Smart Contract**
   - Manage subscription creation and lifecycle
   - Process payments securely
   - Register and verify function call access keys
   - Handle merchant relationships

2. **Shade Agent (TEE Worker)**
   - Monitor subscriptions for due payments
   - Securely store private keys
   - Sign and submit payment transactions
   - Handle payment failures and retries

3. **User Interface**
   - Create and manage subscriptions
   - View payment history
   - Pause or cancel subscriptions

## Project Goals

1. **Security**: Provide a secure way to handle recurring payments without exposing private keys or requiring unlimited approvals.

2. **User Control**: Give users full transparency and control over their subscription terms and payments.

3. **Merchant Flexibility**: Support various payment models and subscription types.

4. **Cross-Chain Potential**: Build with support for expansion to other chains through NEAR Chain Signatures.

## Success Criteria

1. Users can create subscriptions with limited payment authorizations
2. Payments are processed automatically when due
3. Users can manage (view, pause, cancel) their subscriptions
4. Merchants can receive payments reliably
5. The system maintains security of private keys and payment authorizations
