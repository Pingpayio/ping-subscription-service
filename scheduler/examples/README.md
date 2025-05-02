# Scheduler Service Examples

This directory contains examples demonstrating how to use the Scheduler Service.

## Available Examples

### Create and Execute a Job

This example demonstrates creating a job via the API endpoint and having it call a specified target with a payload.

#### Files:
- `create-and-execute-job.js`: The main example script that creates a job and waits for it to execute
- `mock-target-server.js`: A simple HTTP server that acts as a target for the job

#### How to Run:

1. Start the scheduler service in one terminal:
   ```bash
   cd scheduler
   bun run dev
   ```

2. Start the mock target server in another terminal:
   ```bash
   cd scheduler
   bun run example:target
   ```

3. Run the example script in a third terminal:
   ```bash
   cd scheduler
   bun run example:job
   ```

#### What Happens:

1. The example script creates a job scheduled to run 5 seconds in the future
2. The job is stored in the database and added to the queue
3. When the scheduled time arrives, the worker processes the job
4. The worker makes an HTTP request to the mock target server
5. The mock target server logs the request and responds with a success message
6. The example script checks the job status to confirm it executed successfully

## Creating Your Own Examples

You can use these examples as a starting point for creating your own custom jobs and integrations with the Scheduler Service.

To create a new example:

1. Create a new JavaScript file in the `examples` directory
2. Use the Scheduler Service API to create and manage jobs
3. Implement any necessary target endpoints for your jobs to call

For more information on the available API endpoints and job configuration options, see the main [README.md](../README.md) file.
