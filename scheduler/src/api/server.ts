/**
 * API server implementation
 *
 * This module implements the RESTful API for job management.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import queue from "../queues/index.js";
import {
  JobSchema,
  JobInput,
  Job,
  JobData,
  ScheduleType,
  JobStatus,
} from "../types/job.js";
import {
  calculateInitialDelay,
  calculateRepeatOptions,
  calculateNextRun,
  formatDate,
} from "../lib/scheduler.js";

// Create a new Hono app
const app = new Hono();

// Parse ALLOWED_ORIGINS from environment variable
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
let corsOrigin: string | string[] = "*"; // Default to allow all

if (allowedOriginsEnv) {
  const origins = allowedOriginsEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length > 0) {
    corsOrigin = origins;
  }
}

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: corsOrigin,
    credentials: true, // Allow credentials (cookies, authorization headers)
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"], // Headers the server can read
    exposeHeaders: ["Content-Length", "X-Request-Id"], // Headers the client can read
    maxAge: 600, // Cache preflight requests for 10 minutes
  }),
);

// Serve static files from the static directory
app.use('/static/*', serveStatic({ root: './' }))

// Serve dashboard files from root for the dashboard UI
app.use('/*', serveStatic({ 
  root: './static/dashboard/',
  rewriteRequestPath: (path) => {
    // Serve index.html for the root path
    if (path === '/') return '/index.html';
    // Remove leading slash for other files
    return path.replace(/^\//, '');
  },
  mimes: {
    js: 'application/javascript',
    css: 'text/css',
    html: 'text/html'
  }
}))

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Run a job immediately
app.post("/jobs/:id/run", async (c) => {
  try {
    const id = c.req.param("id");

    // Check if the job exists
    const checkQuery = "SELECT * FROM jobs WHERE id = $1";
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return c.json({ message: "Job not found" }, 404);
    }

    const job = checkResult.rows[0];

    // Prepare the job data for BullMQ
    const bullJobData: JobData = {
      jobId: id,
      target: job.target,
      type: job.type,
      payload: job.payload,
    };

    // Add the job to the queue with no delay
    await queue.add(`${job.name}-manual`, bullJobData, {
      jobId: `${id}-manual-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: 500,
    });

    return c.json({ message: "Job triggered successfully" });
  } catch (error) {
    console.error("Error running job:", error);
    return c.json(
      { message: "Error running job", error: (error as Error).message },
      500,
    );
  }
});

// Create a job
app.post("/jobs", async (c) => {
  try {
    // Parse and validate the request body
    const body = await c.req.json();
    const result = JobSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { message: "Invalid job data", errors: result.error.format() },
        400,
      );
    }

    const jobData = result.data as JobInput;

    // Generate a UUID for the job
    const id = uuidv4();

    // Calculate the next run time
    const nextRun = calculateNextRun(jobData);
    if (!nextRun && jobData.schedule_type !== ScheduleType.SPECIFIC_TIME) {
      return c.json({ message: "Invalid schedule configuration" }, 400);
    }

    // Insert the job into the database
    const query = `
      INSERT INTO jobs (
        id, name, description, type, target, payload, 
        cron_expression, schedule_type, specific_time, 
        interval, interval_value, next_run, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      id,
      jobData.name,
      jobData.description || null,
      jobData.type,
      jobData.target,
      jobData.payload || null,
      jobData.cron_expression || null,
      jobData.schedule_type,
      jobData.specific_time || null,
      jobData.interval || null,
      jobData.interval_value || null,
      nextRun ? formatDate(nextRun) : null,
      jobData.status || JobStatus.ACTIVE,
    ];

    const dbResult = await db.query(query, values);
    const job = dbResult.rows[0];

    // Prepare the job data for BullMQ
    const bullJobData: JobData = {
      jobId: id,
      target: jobData.target,
      type: jobData.type,
      payload: jobData.payload,
    };

    // Add the job to the queue
    if (jobData.schedule_type === ScheduleType.SPECIFIC_TIME) {
      // For specific_time jobs, use delay
      const delay = calculateInitialDelay(jobData);

      if (delay === null) {
        return c.json({ message: "Specific time must be in the future" }, 400);
      }

      await queue.add(jobData.name, bullJobData, {
        jobId: id,
        delay,
        removeOnComplete: true,
        removeOnFail: 500,
      });
    } else {
      // For cron and recurring jobs, use repeat options
      const repeatOptions = calculateRepeatOptions(jobData);

      if (repeatOptions === null) {
        return c.json({ message: "Invalid repeat configuration" }, 400);
      }

      await queue.add(jobData.name, bullJobData, {
        jobId: id,
        repeat: repeatOptions,
        removeOnComplete: true,
        removeOnFail: 500,
      });
    }

    return c.json({ message: "Job created successfully", job }, 201);
  } catch (error) {
    console.error("Error creating job:", error);
    return c.json(
      { message: "Error creating job", error: (error as Error).message },
      500,
    );
  }
});

// Get all jobs
app.get("/jobs", async (c) => {
  try {
    // Get status filter from query params
    const status = c.req.query("status");

    // Build the query
    let query = "SELECT * FROM jobs";
    const values: any[] = [];

    if (status) {
      query += " WHERE status = $1";
      values.push(status);
    }

    query += " ORDER BY created_at DESC";

    // Execute the query
    const result = await db.query(query, values);

    return c.json(result.rows);
  } catch (error) {
    console.error("Error getting jobs:", error);
    return c.json(
      { message: "Error getting jobs", error: (error as Error).message },
      500,
    );
  }
});

// Get a job by ID
app.get("/jobs/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // Get the job from the database
    const query = "SELECT * FROM jobs WHERE id = $1";
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return c.json({ message: "Job not found" }, 404);
    }

    return c.json(result.rows[0]);
  } catch (error) {
    console.error("Error getting job:", error);
    return c.json(
      { message: "Error getting job", error: (error as Error).message },
      500,
    );
  }
});

// Update a job
app.put("/jobs/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // Check if the job exists
    const checkQuery = "SELECT * FROM jobs WHERE id = $1";
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return c.json({ message: "Job not found" }, 404);
    }

    // Parse and validate the request body
    const body = await c.req.json();
    const result = JobSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { message: "Invalid job data", errors: result.error.format() },
        400,
      );
    }

    const jobData = result.data as JobInput;

    // Calculate the next run time
    const nextRun = calculateNextRun(jobData);
    if (!nextRun && jobData.schedule_type !== ScheduleType.SPECIFIC_TIME) {
      return c.json({ message: "Invalid schedule configuration" }, 400);
    }

    // Update the job in the database
    const query = `
      UPDATE jobs
      SET name = $2,
          description = $3,
          type = $4,
          target = $5,
          payload = $6,
          cron_expression = $7,
          schedule_type = $8,
          specific_time = $9,
          interval = $10,
          interval_value = $11,
          next_run = $12,
          status = $13,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      jobData.name,
      jobData.description || null,
      jobData.type,
      jobData.target,
      jobData.payload || null,
      jobData.cron_expression || null,
      jobData.schedule_type,
      jobData.specific_time || null,
      jobData.interval || null,
      jobData.interval_value || null,
      nextRun ? formatDate(nextRun) : null,
      jobData.status || JobStatus.ACTIVE,
    ];

    const dbResult = await db.query(query, values);
    const job = dbResult.rows[0];

    // Remove the existing job from the queue
    await queue.remove(id);

    // Prepare the job data for BullMQ
    const bullJobData: JobData = {
      jobId: id,
      target: jobData.target,
      type: jobData.type,
      payload: jobData.payload,
    };

    // Add the updated job to the queue
    if (jobData.schedule_type === ScheduleType.SPECIFIC_TIME) {
      // For specific_time jobs, use delay
      const delay = calculateInitialDelay(jobData);

      if (delay === null) {
        return c.json({ message: "Specific time must be in the future" }, 400);
      }

      await queue.add(jobData.name, bullJobData, {
        jobId: id,
        delay,
        removeOnComplete: true,
        removeOnFail: 500,
      });
    } else {
      // For cron and recurring jobs, use repeat options
      const repeatOptions = calculateRepeatOptions(jobData);

      if (repeatOptions === null) {
        return c.json({ message: "Invalid repeat configuration" }, 400);
      }

      await queue.add(jobData.name, bullJobData, {
        jobId: id,
        repeat: repeatOptions,
        removeOnComplete: true,
        removeOnFail: 500,
      });
    }

    return c.json({ message: "Job updated successfully", job });
  } catch (error) {
    console.error("Error updating job:", error);
    return c.json(
      { message: "Error updating job", error: (error as Error).message },
      500,
    );
  }
});

// Delete a job
app.delete("/jobs/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // Delete the job from the database
    const query = "DELETE FROM jobs WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return c.json({ message: "Job not found" }, 404);
    }

    // Remove the job from the queue
    await queue.remove(id);

    return c.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return c.json(
      { message: "Error deleting job", error: (error as Error).message },
      500,
    );
  }
});

// API endpoints are handled before this fallback

export default app;
