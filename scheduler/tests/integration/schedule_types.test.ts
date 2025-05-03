/**
 * Integration test for different schedule types
 *
 * This test demonstrates creating jobs with different schedule types (cron and recurring)
 * and verifying that they execute correctly.
 */
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  vi,
} from "vitest";
import { serve } from "@hono/node-server";
import nock from "nock";

// Import the app, database, and worker
import app from "../../src/api/server.js";
import db from "../../src/db/index.js";
import { Worker } from "bullmq";
import { QUEUE_NAME } from "../../src/queues/index.js";

// Import the SDK client
import { 
  SchedulerClient, 
  JobType, 
  ScheduleType, 
  IntervalType,
  JobStatus 
} from "../../packages/scheduler-sdk/src/index.js";

describe("Job Schedule Types", () => {
  let server: any;
  let client: SchedulerClient;
  let worker: Worker;
  let serverUrl: string;

  // Set up database and mocks before each test
  beforeEach(async () => {
    // Clean up the jobs table before each test
    try {
      await db.query("DELETE FROM jobs");
    } catch (error) {
      console.error("Error cleaning up jobs table:", error);
      // If the table doesn't exist yet, that's okay
    }

    // Reset all mocks
    vi.clearAllMocks();
  });

  // Set up the server before all tests
  beforeAll(() => {
    // Start the server
    server = serve({
      fetch: app.fetch,
      port: 0, // Use a random port
    });

    // Get the server URL
    const address = server.address();
    serverUrl = `http://localhost:${address.port}`;
    
    // Create the SDK client
    client = new SchedulerClient({
      baseUrl: serverUrl
    });

    // Configure nock to allow network connections to the test server and localhost
    nock.enableNetConnect(/(localhost|127\.0\.0\.1|mock-target\.com)/);

    // Start the worker
    worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { jobId, target, type, payload } = job.data;
        console.log(`Test worker processing job ${jobId} of type ${type}`);

        // Make the HTTP request
        const axios = await import("axios");
        await axios.default.post(target, payload);

        return true;
      },
      {
        connection: {
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379"),
        },
        concurrency: 5,
      },
    );

    console.log("Test worker started");
  });

  // Clean up after all tests
  afterAll(async () => {
    // Close the server
    await server.close();

    // Close the worker
    await worker.close();
    console.log("Test worker closed");

    // Restore nock
    nock.cleanAll();
    nock.enableNetConnect();
  });

  // Clean up after each test
  afterEach(() => {
    // Clean up nock
    nock.cleanAll();
  });

  test(
    "should create a job with cron schedule and execute it",
    { timeout: 70000 },
    async () => {
      // Set up a mock target server
      const targetUrl = "http://mock-target.com";
      const targetPath = "/cron-test";
      const payload = { message: "cron test payload" };

      // Mock the target endpoint
      const targetMock = nock(targetUrl)
        .post(targetPath, payload)
        .reply(200, { success: true });

      // Create a job with a cron schedule that runs every minute
      // Using * * * * * which means "every minute"
      const jobData = {
        name: "Cron Test Job",
        description: "A test job with cron schedule",
        type: JobType.HTTP,
        target: `${targetUrl}${targetPath}`,
        payload,
        schedule_type: ScheduleType.CRON,
        cron_expression: "* * * * *", // Every minute
        status: JobStatus.ACTIVE,
      };

      // Create the job using the SDK client
      const job = await client.createJob(jobData);

      // Verify the job was created correctly
      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.name).toBe(jobData.name);
      expect(job.type).toBe(jobData.type);
      expect(job.target).toBe(jobData.target);
      expect(job.schedule_type).toBe(ScheduleType.CRON);
      expect(job.cron_expression).toBe(jobData.cron_expression);

      // Wait for the job to be processed (60 seconds should be enough for a cron job)
      console.log("Waiting for cron job to execute...");
      await new Promise((resolve) => setTimeout(resolve, 60000));

      // Verify that the target endpoint was called
      expect(targetMock.isDone()).toBe(true);
    },
  );

  test(
    "should create a job with recurring schedule and execute it",
    { timeout: 70000 },
    async () => {
      // Set up a mock target server
      const targetUrl = "http://mock-target.com";
      const targetPath = "/recurring-test";
      const payload = { message: "recurring test payload" };

      // Mock the target endpoint
      const targetMock = nock(targetUrl)
        .post(targetPath, payload)
        .reply(200, { success: true });

      // Create a job with a recurring schedule (every minute)
      const jobData = {
        name: "Recurring Test Job",
        description: "A test job with recurring schedule",
        type: JobType.HTTP,
        target: `${targetUrl}${targetPath}`,
        payload,
        schedule_type: ScheduleType.RECURRING,
        interval: IntervalType.MINUTE,
        interval_value: 1, // Every 1 minute
        status: JobStatus.ACTIVE,
      };

      // Create the job using the SDK client
      const job = await client.createJob(jobData);

      // Verify the job was created correctly
      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.name).toBe(jobData.name);
      expect(job.type).toBe(jobData.type);
      expect(job.target).toBe(jobData.target);
      expect(job.schedule_type).toBe(ScheduleType.RECURRING);
      expect(job.interval).toBe(jobData.interval);
      expect(job.interval_value).toBe(jobData.interval_value);

      // Wait for the job to be processed (60 seconds should be enough for a recurring job)
      console.log("Waiting for recurring job to execute...");
      await new Promise((resolve) => setTimeout(resolve, 60000));

      // Verify that the target endpoint was called
      expect(targetMock.isDone()).toBe(true);
    },
  );
});
