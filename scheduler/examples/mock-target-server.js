/**
 * Mock Target Server
 *
 * This is a simple HTTP server that logs incoming requests and responds with a success message.
 * It's used as a target for the scheduler service in the examples.
 *
 * Usage: bun run examples/mock-target-server.js
 */

import { createServer } from "http";

// Configuration
const PORT = 3001;
const WEBHOOK_PATH = "/webhook";

// Create the server
const server = createServer((req, res) => {
  const { method, url, headers } = req;
  const timestamp = new Date().toISOString();

  console.log(`\n[${timestamp}] Received ${method} request to ${url}`);
  console.log("Headers:", JSON.stringify(headers, null, 2));

  // Only process POST requests to the webhook path
  if (method === "POST" && url === WEBHOOK_PATH) {
    let body = "";

    // Collect the request body
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Process the complete request
    req.on("end", () => {
      try {
        // Try to parse the body as JSON
        const jsonBody = JSON.parse(body);
        console.log("Request body:", JSON.stringify(jsonBody, null, 2));

        // Send a success response
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "Webhook received successfully",
            receivedAt: timestamp,
          }),
        );
      } catch (error) {
        // If the body is not valid JSON
        console.log("Request body (raw):", body);

        // Send a success response anyway
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "Webhook received successfully (non-JSON payload)",
            receivedAt: timestamp,
          }),
        );
      }
    });
  } else {
    // For any other request, return a simple response
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Mock Target Server is running. Send POST requests to /webhook");
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Mock Target Server is running at http://localhost:${PORT}`);
  console.log(`Send POST requests to http://localhost:${PORT}${WEBHOOK_PATH}`);
});

// Handle server shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down Mock Target Server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
