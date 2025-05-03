# @crosspost/scheduler-sdk

A TypeScript SDK for interacting with the Scheduler service.

## Installation

```bash
npm install @crosspost/scheduler-sdk
```

## Usage

### Initialize the client

```typescript
import { SchedulerClient } from '@crosspost/scheduler-sdk';

// Create a client with default options (connects to http://localhost:3000)
const client = new SchedulerClient();

// Or with custom options
const client = new SchedulerClient({
  baseUrl: 'https://scheduler.example.com',
  timeout: 5000, // 5 seconds
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

### Create a job

```typescript
import { 
  SchedulerClient, 
  JobType, 
  ScheduleType, 
  IntervalType 
} from '@crosspost/scheduler-sdk';

const client = new SchedulerClient();

// Create a job that runs once at a specific time
const specificTimeJob = await client.createJob({
  name: 'One-time notification',
  description: 'Send a notification at a specific time',
  type: JobType.HTTP,
  target: 'https://api.example.com/notify',
  payload: { message: 'Hello, world!' },
  schedule_type: ScheduleType.SPECIFIC_TIME,
  specific_time: '2025-12-31T23:59:59Z'
});

// Create a job that runs on a recurring schedule
const recurringJob = await client.createJob({
  name: 'Daily report',
  description: 'Send a daily report',
  type: JobType.HTTP,
  target: 'https://api.example.com/report',
  payload: { report: 'daily' },
  schedule_type: ScheduleType.RECURRING,
  interval: IntervalType.DAY,
  interval_value: 1
});

// Create a job that runs on a cron schedule
const cronJob = await client.createJob({
  name: 'Weekly cleanup',
  description: 'Run weekly cleanup tasks',
  type: JobType.HTTP,
  target: 'https://api.example.com/cleanup',
  payload: { task: 'cleanup' },
  schedule_type: ScheduleType.CRON,
  cron_expression: '0 0 * * 0' // Every Sunday at midnight
});
```

### Get a job

```typescript
// Get a job by ID
const job = await client.getJob('job-id');
console.log(job);
```

### Update a job

```typescript
// Update a job
const updatedJob = await client.updateJob('job-id', {
  description: 'Updated description',
  payload: { updated: true }
});
```

### Delete a job

```typescript
// Delete a job
await client.deleteJob('job-id');
```

### List jobs

```typescript
// List all jobs
const allJobs = await client.listJobs();

// List active jobs
const activeJobs = await client.listActiveJobs();

// List failed jobs
const failedJobs = await client.listFailedJobs();

// List inactive jobs
const inactiveJobs = await client.listInactiveJobs();
```

## Best Practices

### Avoiding duplicate jobs

To avoid creating duplicate jobs, you can use the `createJobIfNotExists` method:

```typescript
import { SchedulerClient, JobType, ScheduleType } from '@crosspost/scheduler-sdk';

const client = new SchedulerClient();

// This will only create the job if no job with the same name exists
const job = await client.createJobIfNotExists({
  name: 'Unique job name',
  type: JobType.HTTP,
  target: 'https://api.example.com/endpoint',
  schedule_type: ScheduleType.SPECIFIC_TIME,
  specific_time: '2025-01-01T00:00:00Z'
});
```

Alternatively, you can check if a job exists before creating it:

```typescript
const jobName = 'Unique job name';
const exists = await client.jobExistsByName(jobName);

if (!exists) {
  await client.createJob({
    name: jobName,
    // ... other job properties
  });
}
```

### Error handling

The SDK throws specific error types that you can catch and handle:

```typescript
import { 
  SchedulerClient, 
  ApiError, 
  NetworkError, 
  JobNotFoundError, 
  DuplicateJobError 
} from '@crosspost/scheduler-sdk';

const client = new SchedulerClient();

try {
  const job = await client.getJob('non-existent-id');
} catch (error) {
  if (error instanceof JobNotFoundError) {
    console.error(`Job not found: ${error.jobId}`);
  } else if (error instanceof ApiError) {
    console.error(`API error (${error.statusCode}): ${error.message}`);
    console.error('Response data:', error.data);
  } else if (error instanceof NetworkError) {
    console.error(`Network error: ${error.message}`);
    console.error('Original error:', error.originalError);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Managing job lifecycles

Here's a complete example of managing job lifecycles:

```typescript
import { SchedulerClient, JobType, ScheduleType, JobStatus } from '@crosspost/scheduler-sdk';

async function manageJobs() {
  const client = new SchedulerClient();
  
  // 1. Clean up any failed jobs
  const failedJobs = await client.listFailedJobs();
  for (const job of failedJobs) {
    console.log(`Cleaning up failed job: ${job.name} (${job.id})`);
    await client.deleteJob(job.id);
  }
  
  // 2. Create or update a job
  const jobName = 'Daily sync';
  let job;
  
  try {
    // Try to find existing job
    const existingJobs = await client.findJobsByName(jobName);
    
    if (existingJobs.length > 0) {
      // Update existing job
      job = await client.updateJob(existingJobs[0].id, {
        payload: { lastUpdated: new Date().toISOString() }
      });
      console.log(`Updated existing job: ${job.id}`);
    } else {
      // Create new job
      job = await client.createJob({
        name: jobName,
        description: 'Daily data synchronization',
        type: JobType.HTTP,
        target: 'https://api.example.com/sync',
        payload: { source: 'scheduler-sdk' },
        schedule_type: ScheduleType.RECURRING,
        interval: IntervalType.DAY,
        interval_value: 1
      });
      console.log(`Created new job: ${job.id}`);
    }
  } catch (error) {
    console.error('Error managing job:', error);
  }
  
  // 3. List all active jobs for monitoring
  const activeJobs = await client.listActiveJobs();
  console.log(`Active jobs: ${activeJobs.length}`);
  activeJobs.forEach(job => {
    console.log(`- ${job.name} (${job.id}): Next run at ${job.next_run}`);
  });
}

manageJobs().catch(console.error);
```

## API Reference

### SchedulerClient

The main client for interacting with the Scheduler API.

#### Constructor

```typescript
new SchedulerClient(options?: SchedulerClientOptions)
```

Options:
- `baseUrl`: Base URL for the Scheduler API (default: 'http://localhost:3000')
- `timeout`: Timeout for API requests in milliseconds (default: 10000)
- `headers`: Headers to include with every request

#### Methods

- `createJob(job: JobInput): Promise<Job>` - Create a new job
- `getJob(id: string): Promise<Job>` - Get a job by ID
- `updateJob(id: string, job: Partial<JobInput>): Promise<Job>` - Update a job
- `deleteJob(id: string): Promise<string>` - Delete a job
- `listJobs(params?: JobListParams): Promise<Job[]>` - List jobs with optional filtering
- `findJobsByName(name: string): Promise<Job[]>` - Find jobs by name
- `jobExistsByName(name: string): Promise<boolean>` - Check if a job with the given name exists
- `createJobIfNotExists(job: JobInput): Promise<Job>` - Create a job if it doesn't already exist
- `listActiveJobs(): Promise<Job[]>` - List active jobs
- `listFailedJobs(): Promise<Job[]>` - List failed jobs
- `listInactiveJobs(): Promise<Job[]>` - List inactive jobs
