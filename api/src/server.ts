import { serve } from "@hono/node-server";
import * as dotenv from "dotenv";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { config } from "./config.js";
import { setKey, setContractId } from "@neardefi/shade-agent-js";

// Load environment variables
dotenv.config();

// Initialize configuration
config.init();

// Initialize SDK
if (config.contractId) {
  setContractId(config.contractId);
}
if (config.signerId && config.secretKey) {
  setKey(config.signerId, config.secretKey);
}

// Import routes
import schedulerRoutes from "./routes/scheduler.js";
import agentRoutes from "./routes/agent.js";
import subscriptionRoutes from "./routes/subscription.js";
import merchantRoutes from "./routes/merchant.js";
import workerRoutes from "./routes/worker.js";
import balanceRoutes from "./routes/balance.js";
import staticRoutes from "./routes/static.js";

// Create Hono app
const app = new Hono();

// Middleware
app.use(logger());
app.use(cors(config.cors));

// In-memory randomness only available to this instance of TEE
const randomArray = new Uint8Array(32);
crypto.getRandomValues(randomArray);

// Mount routes
app.route("/api/scheduler", schedulerRoutes);
app.route("/api/agent", agentRoutes);
app.route("/api/subscription", subscriptionRoutes);
app.route("/api/merchants", merchantRoutes);
app.route("/api/worker", workerRoutes);
app.route("/api/balance", balanceRoutes);
app.route("/", staticRoutes);

// Start the server
console.log(`Server is running on port ${config.port}`);

serve({
  fetch: app.fetch,
  port: Number(config.port),
});
