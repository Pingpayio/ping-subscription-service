import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "hono/serve-static";
import { logger } from "hono/logger";
import * as dotenv from "dotenv";

// Load environment variables
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./.env.development.local" });
} else {
  dotenv.config();
}

// Import utilities
import { shadeAgent } from "./utils/shade-agent.js";
import { TappdClient } from "./utils/tappd.js";
import { generateSeedPhrase } from "near-seed-phrase";
import {
  setKey,
  getImplicit,
  getAccount,
  contractCall,
  contractView,
  getBalance,
} from "./utils/near-provider.js";

// Create Hono app
const app = new Hono();

// Middleware
app.use(logger());

// Serve static files
import fs from "fs";
import path from "path";

// Serve static files from the public directory
app.get("/public/*", async (c) => {
  const filePath = c.req.path.replace("/public/", "");
  const fullPath = path.join("./public", filePath);

  try {
    const content = await fs.promises.readFile(fullPath);
    const contentType = getContentType(filePath);
    return new Response(content, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (e) {
    return c.notFound();
  }
});

// Helper function to determine content type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html";
    case ".css":
      return "text/css";
    case ".js":
      return "text/javascript";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

// In-memory randomness only available to this instance of TEE
const randomArray = new Uint8Array(32);
crypto.getRandomValues(randomArray);

// API Routes
// Derive endpoint
app.get("/api/derive", async (c) => {
  // env dev
  if (process.env.NEXT_PUBLIC_accountId !== undefined) {
    return c.json({
      accountId: process.env.NEXT_PUBLIC_accountId,
    });
  }

  // env prod in TEE
  const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
  const client = new TappdClient(endpoint);

  // Add this check to prevent TEE operations in local dev
  if (process.env.NODE_ENV !== "production") {
    throw new Error("TEE operations only available in production");
  }

  // entropy from TEE hardware
  const randomString = Buffer.from(randomArray).toString("hex");
  const keyFromTee = await client.deriveKey(randomString, randomString);

  // hash of in-memory and TEE entropy
  const hash = await crypto.subtle.digest(
    "SHA-256",
    Buffer.concat([randomArray, keyFromTee.asUint8Array(32)]),
  );

  // !!! data.secretKey should not be exfiltrated anywhere !!! no logs or debugging tools !!!
  const data = generateSeedPhrase(hash);
  const accountId = getImplicit(data.publicKey);

  // set the secretKey (inMemoryKeyStore only)
  setKey(accountId, data.secretKey);

  return c.json({
    accountId,
  });
});

// Register endpoint
app.get("/api/register", async (c) => {
  // env dev
  if (process.env.NEXT_PUBLIC_accountId !== undefined) {
    // getting collateral won't work with a simulated TEE quote
    console.log(
      "cannot register while running tappd simulator:",
      process.env.DSTACK_SIMULATOR_ENDPOINT,
    );
    return c.json({ registered: false });
  }

  // env prod in TEE
  const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
  const client = new TappdClient(endpoint);

  // get tcb info from tappd
  const { tcb_info } = await client.getInfo();
  const { app_compose } = JSON.parse(tcb_info);
  // match 'sha256:' in docker-compose.yaml (arrange docker-compose.yaml accordingly)
  const [codehash] = app_compose.match(/sha256:([a-f0-9]*)/gim);

  // get TDX quote
  const randomNumString = Math.random().toString();
  const ra = await client.tdxQuote(randomNumString);
  const quote_hex = ra.quote.replace(/^0x/, "");

  // get quote collateral
  const formData = new FormData();
  formData.append("hex", quote_hex);
  let collateral, checksum;
  // WARNING: this endpoint could throw or be offline
  const res2 = await (
    await fetch("https://proof.t16z.com/api/upload", {
      method: "POST",
      body: formData,
    })
  ).json();
  checksum = res2.checksum;
  collateral = JSON.stringify(res2.quote_collateral);

  // register the worker (returns bool)
  const res3 = await contractCall({
    methodName: "register_worker",
    args: {
      quote_hex,
      collateral,
      checksum,
      codehash,
    },
  });

  return c.json({ registered: res3 });
});

// IsVerified endpoint
app.get("/api/isVerified", async (c) => {
  const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
  const client = new TappdClient(endpoint);

  // get tcb info from tappd
  const { tcb_info } = await client.getInfo();
  const { app_compose } = JSON.parse(tcb_info);
  // first sha256: match of docker-compose.yaml will be codehash (arrange docker-compose.yaml accordingly)
  const [codehash] = app_compose.match(/sha256:([a-f0-9]*)/gim);

  let verified = false;
  try {
    await contractCall({
      methodName: "is_verified_by_codehash",
      args: {
        codehash,
      },
    });
    verified = true;
  } catch (e) {
    verified = false;
  }

  return c.json({ verified });
});

// Monitor endpoint
app.post("/api/monitor", async (c) => {
  try {
    const body = await c.req.json();
    const { action, interval } = body;

    switch (action) {
      case "start":
        // Initialize the shade agent if needed
        if (!shadeAgent.isInitialized) {
          await shadeAgent.initialize();
          shadeAgent.isInitialized = true;
        }

        // Start monitoring with the specified interval (or default)
        await shadeAgent.startMonitoring(interval || 60000);

        return c.json({
          success: true,
          message: "Monitoring service started",
          isMonitoring: shadeAgent.isMonitoring,
        });

      case "stop":
        // Stop monitoring
        shadeAgent.stopMonitoring();

        return c.json({
          success: true,
          message: "Monitoring service stopped",
          isMonitoring: shadeAgent.isMonitoring,
        });

      case "status":
        return c.json({
          success: true,
          isMonitoring: shadeAgent.isMonitoring,
          processingQueue: Array.from(shadeAgent.processingQueue.entries()).map(
            ([id, status]) => ({
              id,
              status: status.status,
              retryCount: status.retryCount,
            }),
          ),
        });

      default:
        return c.json({ error: "Invalid action" }, 400);
    }
  } catch (error) {
    console.error("Error handling monitoring request:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Merchants endpoint
app.get("/api/merchants", async (c) => {
  try {
    const merchants = await contractView({
      methodName: "get_merchants",
      args: {},
    });

    return c.json({ merchants });
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Subscription endpoint
app.post("/api/subscription", async (c) => {
  try {
    const body = await c.req.json();
    const { action, subscriptionId, ...params } = body;

    switch (action) {
      case "create":
        const { merchantId, amount, frequency, maxPayments, tokenAddress } =
          params;

        const result = await contractCall({
          methodName: "create_subscription",
          args: {
            merchant_id: merchantId,
            amount,
            frequency,
            max_payments: maxPayments,
            token_address: tokenAddress || null,
          },
        });

        return c.json({
          success: true,
          subscriptionId: result.subscription_id,
        });

      case "get":
        const subscription = await contractView({
          methodName: "get_subscription",
          args: { subscription_id: subscriptionId },
        });

        return c.json({ subscription });

      case "list":
        const { accountId } = params;
        const subscriptions = await contractView({
          methodName: "get_user_subscriptions",
          args: { account_id: accountId },
        });

        return c.json({ subscriptions });

      case "pause":
        await contractCall({
          methodName: "pause_subscription",
          args: { subscription_id: subscriptionId },
        });

        return c.json({ success: true, message: "Subscription paused" });

      case "resume":
        await contractCall({
          methodName: "resume_subscription",
          args: { subscription_id: subscriptionId },
        });

        return c.json({ success: true, message: "Subscription resumed" });

      case "cancel":
        await contractCall({
          methodName: "cancel_subscription",
          args: { subscription_id: subscriptionId },
        });

        return c.json({ success: true, message: "Subscription canceled" });

      default:
        return c.json({ error: "Invalid action" }, 400);
    }
  } catch (error) {
    console.error("Error handling subscription request:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Serve static files from the dist directory (Vite build output)
app.get("/assets/*", async (c) => {
  const filePath = c.req.path.replace("/assets/", "");
  const fullPath = path.join("./dist/assets", filePath);

  try {
    const content = await fs.promises.readFile(fullPath);
    const contentType = getContentType(filePath);
    return new Response(content, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (e) {
    return c.notFound();
  }
});

// Root route - serve the index.html file
app.get("/", async (c) => {
  try {
    // In development, serve from the root index.html
    // In production, serve from the Vite build output
    const indexPath =
      process.env.NODE_ENV === "production"
        ? "./dist/index.html"
        : "./index.html";

    const content = await fs.promises.readFile(indexPath);
    return new Response(content, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    console.error("Error serving index.html:", e);
    return c.text("Error loading page", 500);
  }
});

// Start the server
const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
