/**
 * Example of the subscription key flow using the Ping Subscription SDK
 *
 * This example demonstrates how to:
 * 1. Create a subscription
 * 2. Generate a function call access key for the subscription
 * 3. Register the key with the contract
 * 4. Store the private key in the TEE
 */

import { SubscriptionSDK } from "@ping-subscription/sdk";
import { connect, keyStores, WalletConnection } from "near-api-js";

// Initialize the SDK
const sdk = new SubscriptionSDK();

// Initialize NEAR connection
const initNear = async () => {
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const config = {
    networkId: "testnet",
    keyStore,
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://testnet.mynearwallet.com/",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://testnet.nearblocks.io",
  };

  const near = await connect(config);
  const wallet = new WalletConnection(near, "ping-subscription-service");

  return { near, wallet };
};

// Main function to demonstrate the subscription key flow
const createSubscriptionWithKey = async () => {
  try {
    // Initialize NEAR connection
    const { wallet } = await initNear();

    // Check if user is signed in
    if (!wallet.isSignedIn()) {
      console.log("Please sign in to create a subscription");
      wallet.requestSignIn();
      return;
    }

    const accountId = wallet.getAccountId();
    console.log(`Signed in as: ${accountId}`);

    // Step 1: Create a subscription
    const subscriptionParams = {
      merchantId: "merchant.testnet",
      amount: "1000000000000000000000000", // 1 NEAR
      frequency: 2592000, // Monthly (30 days in seconds)
      maxPayments: 12, // 12 payments max
    };

    console.log("Creating subscription...");
    const { success, subscriptionId } =
      await sdk.createSubscription(subscriptionParams);

    if (!success) {
      console.error("Failed to create subscription");
      return;
    }

    console.log(`Subscription created with ID: ${subscriptionId}`);

    // Step 2: Generate a function call access key for the subscription
    console.log("Generating function call access key...");
    const contractId =
      process.env.NEXT_PUBLIC_contractId || "subscription.testnet";

    // Generate the transaction and key pair
    const { transaction, keyPair } = sdk.createSubscriptionKeyTransaction(
      accountId,
      subscriptionId,
      contractId,
      "250000000000000000000000", // 0.25 NEAR allowance
    );

    console.log("Key pair generated:");
    console.log(`Public key: ${keyPair.publicKey}`);
    console.log(`Private key: ${keyPair.privateKey}`);

    // Step 3: Sign and send the transaction to create the function call access key
    console.log("Signing transaction to create function call access key...");
    // In a real application, you would use the wallet to sign and send the transaction
    // For example:
    // const result = await wallet.signAndSendTransaction({
    //   receiverId: accountId,
    //   actions: transaction.actions
    // });

    // For this example, we'll just simulate a successful transaction
    console.log("Transaction signed and sent successfully");

    // Step 4: Register the key with the contract
    console.log("Registering key with the contract...");
    const registerResult = await sdk.registerSubscriptionKey(
      subscriptionId,
      keyPair.publicKey,
    );

    if (!registerResult.success) {
      console.error("Failed to register key with the contract");
      return;
    }

    console.log("Key registered successfully");

    // Step 5: Store the private key in the TEE
    console.log("Storing private key in the TEE...");
    const storeResult = await sdk.storeSubscriptionKey(
      subscriptionId,
      keyPair.privateKey,
      keyPair.publicKey,
    );

    if (!storeResult.success) {
      console.error("Failed to store private key in the TEE");
      return;
    }

    console.log("Private key stored successfully in the TEE");
    console.log("Subscription setup complete!");

    // The subscription is now set up and ready for automatic payments
    // The shade agent will use the stored private key to sign transactions
    // when payments are due
  } catch (error) {
    console.error("Error in subscription key flow:", error);
  }
};

// Run the example
createSubscriptionWithKey();
