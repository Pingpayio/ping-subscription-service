import SubscriptionSDK from "near-subscription-sdk";

// Initialize the SDK
const sdk = new SubscriptionSDK();

// DOM Elements
const accountIdElement = document.getElementById("accountId");
const balanceElement = document.getElementById("balance");
const copyBtn = document.getElementById("copyBtn");
const actionButtons = document.getElementById("actionButtons");
const workerStatus = document.getElementById("workerStatus");
const overlay = document.getElementById("overlay");
const messageElement = document.getElementById("message");

// Utility functions
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const setMessage = async (message, duration = 3000) => {
  messageElement.innerHTML =
    typeof message === "string" ? message : message.outerHTML;
  overlay.classList.remove("hidden");

  if (duration > 0) {
    await sleep(duration);
    overlay.classList.add("hidden");
  }
};

const hideMessage = () => {
  overlay.classList.add("hidden");
};

const formatNearAmount = (amount, decimals = 4) => {
  if (!amount) return "0";
  const nearDecimals = 24;
  const formattedAmount = (Number(amount) / Math.pow(10, nearDecimals)).toFixed(
    decimals,
  );
  return formattedAmount;
};

// API functions using SDK
const deriveAccount = async () => {
  try {
    accountIdElement.classList.add("loading");

    const accountId = await sdk.getWorkerAddress();

    if (accountId) {
      accountIdElement.textContent = accountId;
      accountIdElement.classList.remove("loading");

      // Store full account ID for copying
      accountIdElement.dataset.fullId = accountId;

      // Get balance after a short delay
      await sleep(1000);
      getBalance(accountId);
    }
  } catch (error) {
    console.error("Error deriving account:", error);
    accountIdElement.textContent = "Error deriving account";
    accountIdElement.classList.remove("loading");
    accountIdElement.classList.add("status-error");
  }
};

const getBalance = async (accountId) => {
  try {
    balanceElement.classList.add("loading");

    // In a real implementation, we would call an API endpoint to get the balance
    // For now, we'll simulate this with a placeholder
    const balance = { available: "1000000000000000000000000" }; // 1 NEAR for testing

    balanceElement.textContent = formatNearAmount(balance.available, 4);
    balanceElement.classList.remove("loading");

    // If balance is not zero, show action buttons
    if (balance.available !== "0") {
      renderActionButtons();

      // Check if worker is verified
      checkWorkerVerification();
    } else {
      // If balance is still zero, try again after a delay
      setTimeout(() => getBalance(accountId), 1000);
    }
  } catch (error) {
    console.error("Error getting balance:", error);
    balanceElement.textContent = "Error";
    balanceElement.classList.remove("loading");
  }
};

const registerWorker = async () => {
  try {
    await setMessage(
      '<p class="text-lg font-bold mb-2">Registering Worker</p><p class="loading">Please wait</p>',
    );

    const registered = await sdk.registerWorker();

    const messageContent = `
      <p class="text-lg font-bold mb-2">Registration ${registered ? "Successful" : "Failed"}</p>
      <p>${registered ? "Worker has been registered successfully!" : "Failed to register worker."}</p>
    `;

    await setMessage(messageContent, 2000);

    // Check worker verification after registration
    await checkWorkerVerification();
  } catch (error) {
    console.error("Error registering worker:", error);
    await setMessage(
      `
      <p class="text-lg font-bold mb-2 text-red-600">Error</p>
      <p>${error.message}</p>
    `,
      3000,
    );
  }
};

const checkWorkerVerification = async () => {
  try {
    workerStatus.textContent = "Checking...";
    workerStatus.className = "font-bold loading";

    const verified = await sdk.isWorkerVerified();

    // Update UI based on verification status
    if (verified) {
      workerStatus.textContent = "Verified";
      workerStatus.className = "font-bold status-verified";
      updateActionButtons(true);
    } else {
      workerStatus.textContent = "Not Verified";
      workerStatus.className = "font-bold status-unverified";
      updateActionButtons(false);
    }

    return verified;
  } catch (error) {
    console.error("Error checking worker verification:", error);
    workerStatus.textContent = "Error";
    workerStatus.className = "font-bold status-error";
    return false;
  }
};

// UI Rendering functions
const renderActionButtons = () => {
  actionButtons.innerHTML = `
    <button id="registerBtn" class="bg-red-500 text-white px-4 py-2 rounded mr-2">
      Register Worker
    </button>
    <button id="refreshBtn" class="bg-gray-500 text-white px-4 py-2 rounded">
      Refresh Status
    </button>
  `;

  // Add event listeners
  document
    .getElementById("registerBtn")
    .addEventListener("click", registerWorker);
  document
    .getElementById("refreshBtn")
    .addEventListener("click", checkWorkerVerification);
};

const updateActionButtons = (isVerified) => {
  if (isVerified) {
    // If verified, add subscription management button
    if (!document.getElementById("manageSubscriptionsBtn")) {
      const manageBtn = document.createElement("button");
      manageBtn.id = "manageSubscriptionsBtn";
      manageBtn.className =
        "bg-green-500 text-white px-4 py-2 rounded mt-4 block w-full";
      manageBtn.textContent = "Manage Subscriptions";
      manageBtn.addEventListener("click", () => {
        setMessage(
          '<p class="font-bold">Subscription Management</p><p>This feature is not implemented in this simple version.</p>',
        );
      });

      actionButtons.appendChild(manageBtn);
    }
  }
};

// Event listeners
copyBtn.addEventListener("click", async () => {
  try {
    const accountId =
      accountIdElement.dataset.fullId || accountIdElement.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(accountId);
      await setMessage(
        '<p class="text-green-600 font-bold">Address copied to clipboard!</p>',
        1000,
      );
    } else {
      await setMessage(
        '<p class="text-red-600 font-bold">Clipboard not supported</p>',
      );
    }
  } catch (e) {
    await setMessage('<p class="text-red-600 font-bold">Copy failed</p>');
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  deriveAccount();
});
