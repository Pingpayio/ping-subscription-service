/**
 * Integration test for job creation and execution
 *
 * This test demonstrates creating a job via the SDK client and verifying
 * that the job calls the specified target with the correct payload.
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
import { SchedulerClient, JobType, ScheduleType, JobStatus } from "../../packages/scheduler-sdk/src/index.js";

describe("Job Creation and Execution", () => {
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

  test("should create a job and execute it with the correct payload", async () => {
    // Set up a mock target server
    const targetUrl = "http://mock-target.com";
    const targetPath = "/test";
    const payload = { message: "test payload" };

    // Mock the target endpoint
    const targetMock = nock(targetUrl)
      .post(targetPath, payload)
      .reply(200, { success: true });

    // Create a job using the SDK client
    const jobData = {
      name: "Test Job",
      description: "A test job",
      type: JobType.HTTP,
      target: `${targetUrl}${targetPath}`,
      payload,
      schedule_type: ScheduleType.SPECIFIC_TIME,
      specific_time: new Date(Date.now() + 1000).toISOString(), // 1 second in the future
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

    // Wait for the job to be processed (3 seconds should be enough)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Verify that the target endpoint was called
    expect(targetMock.isDone()).toBe(true);
  });
});
