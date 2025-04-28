# Active Context: NEAR Subscription Service

## Current Work Focus

With the smart contract implementation phase complete, the focus is now on:

1.  **Scheduler Service Integration**: Integrating the external PingPay Scheduler service to handle payment timing.
2.  **Shade Agent Endpoint**: Implementing the HTTP endpoint within the Shade Agent (running in the API service TEE) to be triggered by the scheduler for payment execution.
3.  **API Service Logic**: Adding logic to the API service (`api/src/server.ts`) to manage scheduler jobs corresponding to subscription lifecycles.
4.  **UI Development**: Creating the essential UI components for subscription management.
5.  **Integration**: Connecting the smart contract, API service (including scheduler logic), Shade Agent endpoint, and UI.

## Recent Changes

- Created project repository and initial structure
- Set up basic smart contract with worker agent verification
- Documented architecture and implementation plan
- Completed full smart contract implementation including:
  - Subscription data structures and models
  - Subscription creation and management methods
  - Key registration system
  - Payment processing logic
  - Merchant registration and management
- Updated the subscription key flow in SDK, contract, and API:
  - Implemented key pair generation in the SDK
  - Added function call access key creation with limited permissions
  - Enhanced secure storage of private keys in Worker agent TEE
  - Improved public key registration with the contract
  - Streamlined automated recurring payment processing

## Next Steps

### Immediate Tasks

1. ~~**Extend Smart Contract**~~: ✓ COMPLETED
   - ~~Add subscription data structures~~ ✓
   - ~~Implement subscription creation and management methods~~ ✓
   - ~~Create key registration system~~ ✓
   - ~~Develop payment processing logic~~ ✓

2. **Develop Shade Agent Endpoint & API Logic**:
   - Implement HTTP endpoint in Agent for payment triggers (`/trigger-payment`).
   - Add API logic to create/update/delete scheduler jobs via Scheduler API.
   - Refine Agent's payment execution logic (called via endpoint).
   - Remove Agent polling/monitoring logic.

3. **Create Basic UI**:
   - Design subscription creation flow
   - Implement key generation and registration
   - Build subscription management interface

### Upcoming Tasks

1. **Testing and Integration**:
   - Test contract functions
   - Integrate contract with agent
   - Test end-to-end workflows

2. **Security Auditing**:
   - Review key management
   - Audit contract functions
   - Verify TEE security

3. **UI Enhancements**:
   - Improve user experience
   - Add payment history visualization
   - Implement merchant dashboard

## Active Decisions and Considerations

### Smart Contract Design

- ~~**Data Structure**: Deciding on the optimal data structure for storing subscriptions and their relationships to users, merchants, and keys.~~ ✓ DECIDED
  - Used IterableMap for subscriptions with SubscriptionId as key
  - Used LookupMap for subscription keys
  - Used LookupMap for user and merchant subscriptions
  - Used IterableSet for merchants
- ~~**Access Control**: Determining the appropriate access control mechanisms for different contract methods.~~ ✓ DECIDED
  - Implemented owner-only access for admin functions
  - Implemented user-specific access for subscription management
  - Implemented key-based access for payment processing
- ~~**Gas Optimization**: Considering gas usage and optimization for contract methods.~~ ✓ IMPLEMENTED
  - Used efficient data structures
  - Minimized storage operations

### Shade Agent Implementation & Scheduling

- **Key Storage**: Implemented secure key storage within the TEE (part of the API service) for subscription private keys.
- **Payment Scheduling**: **Decision:** Offloaded to the external PingPay Scheduler service. The API service manages jobs in the scheduler. The Agent provides an HTTP endpoint (`/trigger-payment`) called by the scheduler worker.
- **Payment Execution Trigger**: Agent logic is now triggered via the `/trigger-payment` endpoint instead of internal polling.
- **Error Handling**: Designing robust error handling for:
    - API <-> Scheduler communication failures.
    - Scheduler Worker -> Agent endpoint call failures (handled by Scheduler retries).
    - Agent -> Contract `process_payment` call failures (logged by Agent, reported back to Scheduler Worker).

### User Experience

- **Subscription Creation Flow**: Designing a user-friendly flow for creating subscriptions and generating keys.
- **Subscription Management**: Creating intuitive interfaces for managing subscriptions.
- **Payment Transparency**: Ensuring users have clear visibility into their payment history and upcoming payments.

## Current Challenges

1. **Key Management Security**: Ensuring private keys are securely generated, stored, and used within TEEs.
2. **Payment Reliability**: Designing a robust system for reliable payment processing, even with network issues.
3. **User Experience**: Creating a seamless user experience despite the complexity of blockchain interactions.
4. **TEE Integration**: Properly integrating TEE attestation and verification with the smart contract.

## Recent Decisions

1. **Using Function Call Access Keys**: Decided to use NEAR's Function Call Access Keys for limited payment authorization.
2. **TEE for Key Management**: Chose to use TEEs for secure key management to prevent key exposure.
3. **On-Chain Subscription Data**: Decided to store subscription data on-chain for transparency and security.
4. **Scheduler-Triggered Payment Model**: Opted for a model where the external scheduler triggers the agent (via an HTTP endpoint) to initiate payments when due. The agent itself does not poll.
5. **Subscription Data Structure**: Implemented a comprehensive Subscription struct with all necessary fields for tracking subscription details.
6. **Payment Methods**: Supported both NEAR native token and fungible tokens for subscription payments.
7. **Subscription Status Management**: Implemented status tracking (Active, Paused, Canceled) with appropriate state transitions.
8. **Due Payment Detection**: Created a system for identifying subscriptions with due payments based on next payment date.
9. **SDK Key Generation**: Implemented key pair generation in the SDK to streamline the subscription creation process.
10. **Secure Key Storage**: Enhanced the TEE implementation to securely store private keys for subscriptions.
11. **Automated Payment Processing**: Improved the payment processing flow to automatically retrieve keys and process payments.
