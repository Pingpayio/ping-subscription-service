/**
 * Main entry point for the scheduler API server
 */
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import app from './api/server.js';

// Load environment variables
dotenv.config();

// Get the port from environment variables or use a default
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Start the server
console.log(`Starting scheduler API server on port ${PORT}...`);
serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`Scheduler API server is running at http://localhost:${PORT}`);
