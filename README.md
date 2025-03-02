<div align="center">

# Ping Subscription Service

**Secure, automated recurring payments on NEAR blockchain without pre-funding or unlimited approvals**

</div>

## Overview

**Ping Subscription Service** is a blockchain-based subscription service built on the Shade Agent stack. It enables secure, automated recurring payments without requiring users to pre-fund accounts or approve unlimited spending.

The system solves a fundamental problem in blockchain payments: most networks are designed for one-time transactions, not recurring payments. Unlike traditional banking systems with built-in "pull payment" mechanisms, blockchain typically requires manual transaction approval.


```mermaid
sequenceDiagram
    participant User
    participant UI as Web Interface
    participant API as API Endpoints
    participant TEE as Shade Agent (TEE)
    participant Contract as Subscription Contract
    
    Note over TEE: Agent Registration
    TEE->>API: POST /api/register
    API->>Contract: register_worker(quote_hex, collateral, checksum, codehash)
    Contract-->>API: Registration result
    API-->>TEE: Confirmation
    
    TEE->>API: POST /api/isVerified
    API->>Contract: is_verified_by_codehash(codehash)
    Contract-->>API: Verification result
    API-->>TEE: Confirmation
    
    Note over User,Contract: Subscription Creation
    User->>UI: Select subscription plan
    UI->>API: POST /api/derive
    API->>TEE: Generate secure keypair
    TEE-->>API: Return accountId
    API-->>UI: Return accountId
    
    UI->>API: POST /api/subscription (action: create)
    API->>Contract: create_subscription(...)
    Contract-->>API: Return subscription_id
    API-->>UI: Return subscription_id
    
    UI->>API: POST /api/subscription (action: register_key)
    API->>TEE: Generate keypair for subscription
    TEE-->>API: Return keypair
    API->>Contract: register_subscription_key(...)
    Contract-->>API: Confirmation
    API-->>UI: Confirmation
    
    Note over TEE,Contract: Payment Processing
    User->>UI: Start monitoring
    UI->>API: POST /api/monitor (action: start)
    API->>TEE: Start monitoring service
    TEE-->>API: Confirmation
    API-->>UI: Confirmation
    
    TEE->>API: Check due subscriptions
    API->>Contract: get_due_subscriptions()
    Contract-->>API: List of due subscriptions
    API-->>TEE: Due subscriptions
    
    loop For each due subscription
        TEE->>TEE: Retrieve/derive private key
        TEE->>API: Process payment
        API->>Contract: process_payment(subscription_id)
        Contract->>Contract: Transfer payment
        Contract-->>API: Payment result
        API-->>TEE: Payment result
    end
```

For more detailed technical information, see our [Architecture Document](ARCHITECTURE.md).

## Worker Agent Verification

Automatic recurring payments are made possible through the **Shade Agent**, running in a TEE. This secure environment gives us the ability to trust an agent with a private seed, in order to derive the necessary key pair for charging the account. 

<img width="1400" alt="2 (2)" src="https://github.com/user-attachments/assets/02bfcc61-776b-44da-8ce9-37908e7ccc98" />

The Shade Agent (Worker Agent) running in a TEE verifies itself with the smart contract through:

1. **Account Derivation**: Creates a unique key derived from the TEE's hardware KMS and additional entropy
2. **Remote Attestation**: Obtains a quote from the TEE that proves the environment is secure
3. **Registration**: Submits the attestation quote, collateral, and docker image hash to the smart contract
4. **Verification**: The contract verifies the TEE environment and registers the Worker Agent

Once registered, the Worker Agent can monitor subscriptions and process payments securely.

## Security Considerations

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

## Development

### Local Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

For making calls to the NEAR Contract, create a local `.env.development.local` file with:

```bash
NEXT_PUBLIC_accountId=[YOUR_NEAR_DEV_ACCOUNT_ID]
NEXT_PUBLIC_secretKey=[YOUR_NEAR_DEV_ACCOUNT_SECRET_KEY]
NEXT_PUBLIC_contractId=[YOUR_PROTOCOL_NAME].[YOUR_NEAR_DEV_ACCOUNT_ID]
```

### Deployment to Phala Cloud

1. Build and push your docker image:
   ```bash
   # Update docker:build and docker:push scripts in package.json first
   bun run docker:build
   bun run docker:push
   ```

2. Update `docker-compose.yaml` with your docker hub account, repository name, and image hash

3. On Phala Cloud:
   - Click "deploy" then "from sketch"
   - Select the "advanced" tab
   - Paste in your updated YAML
   - Give the instance a name and deploy

## What are Shade Agents?

Shade Agents are multichain crypto AI agents, verifiable from source code through to their transactions across any blockchain. They combine the security of Trusted Execution Environments (TEEs) with the transparency of blockchain.

Components of a Shade Agent are:

1. Worker Agent deployment in a TEE
2. Smart Contract to verify a TEE's remote attestation and stack
3. NEAR Intents and Chain Signatures for multichain swaps and key management

## License

This project is licensed under the terms of the MIT license.
