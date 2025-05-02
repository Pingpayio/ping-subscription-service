/**
 * Example: Create and Execute a Job
 *
 * This example demonstrates how to create a job via the API endpoint
 * and have it call a specified target with a payload.
 *
 * Prerequisites:
 * 1. Start the scheduler service: `bun run dev`
 * 2. Start a mock target server: `bun run examples/mock-target-server.js`
 */

import axios from "axios";

// Configuration
const SCHEDULER_API_URL = "http://localhost:3000";
const MOCK_TARGET_URL = "http://localhost:3001/webhook";

/**
 * Create a job via the API
 */
async function createJob() {
  console.log("Creating a job...");

  try {
    // Define the job
    const jobData = {
      name: "Example Job",
      description: "A job created from the example script",
      type: "http",
      target: MOCK_TARGET_URL,
      payload: {
        message: "Hello from the scheduler!",
        timestamp: new Date().toISOString(),
      },
      // Schedule the job to run 5 seconds from now
      schedule_type: "specific_time",
      specific_time: new Date(Date.now() + 5000).toISOString(),
    };

    // Send the request to create the job
    const response = await axios.post(`${SCHEDULER_API_URL}/jobs`, jobData);

    console.log("Job created successfully!");
    console.log("Job ID:", response.data.job.id);
    console.log("Job will run at:", response.data.job.next_run || "soon");

    return response.data.job;
  } catch (error) {
    console.error("Error creating job:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Create the job
    const job = await createJob();

    console.log("\nWaiting for the job to execute...");
    console.log(
      "The job will call the mock target server at:",
      MOCK_TARGET_URL,
    );
    console.log(
      "Check the mock target server logs to see the incoming request.",
    );

    // Wait for the job to execute (10 seconds should be enough)
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check the job status
    console.log("\nChecking job status...");
    const response = await axios.get(`${SCHEDULER_API_URL}/jobs/${job.id}`);

    console.log("Job status:", response.data.status);
    console.log("Last run:", response.data.last_run || "Not yet executed");

    if (response.data.error_message) {
      console.error("Job execution failed:", response.data.error_message);
    } else if (response.data.last_run) {
      console.log("Job executed successfully!");
    } else {
      console.log(
        "Job has not been executed yet. It might be delayed or there might be an issue.",
      );
    }
  } catch (error) {
    console.error("Error in example script:", error.message);
  }
}

// Run the example
main();
