/**
 * Database initialization script
 * 
 * This script reads the init.sql file and executes it against the PostgreSQL database
 * specified by the POSTGRES_URL environment variable.
 */
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  // Check if POSTGRES_URL is defined
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    console.error('Error: POSTGRES_URL environment variable is not defined');
    process.exit(1);
  }

  // Create a new client
  const client = new Client({
    connectionString: postgresUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    await client.query(sql);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    // Close the client connection
    await client.end();
  }
}

// Run the initialization function
initializeDatabase();
