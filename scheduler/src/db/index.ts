/**
 * Database connection module
 *
 * This module provides a PostgreSQL client instance that can be used throughout the application.
 * It handles connection setup and error handling.
 */
import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Check if POSTGRES_URL is defined
const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  console.error("Error: POSTGRES_URL environment variable is not defined");
  process.exit(1);
}

/**
 * PostgreSQL connection pool
 *
 * Using a pool instead of a client for better performance and connection management
 */
const pool = new Pool({
  connectionString: postgresUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection to become available
});

// The pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Test the connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to PostgreSQL database at:", res.rows[0].now);
  }
});

/**
 * Execute a query against the PostgreSQL database
 *
 * @param text - The SQL query text
 * @param params - The query parameters
 * @returns The query result
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
  } catch (error) {
    console.error("Error executing query", { text, error });
    throw error;
  }
}

export default {
  query,
  pool,
};
