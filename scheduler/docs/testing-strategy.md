# Testing Strategy for PingPay Scheduler Service

This document outlines the testing strategy for the PingPay Scheduler Service, including test cases, frameworks, and organization.

## Testing Framework

We'll use Bun's built-in test runner, which is compatible with Jest's API. This provides a familiar testing experience while leveraging Bun's performance benefits.

Additional testing libraries:
- **@hono/testing**: For testing Hono API endpoints
- **mock-redis**: For mocking Redis in unit tests
- **pg-mem**: For in-memory PostgreSQL database testing
- **nock**: For mocking HTTP requests
- **supertest**: For API integration testing

## Test Organization

The tests will be organized in a structure that mirrors the source code:

```
scheduler/
├── src/
│   ├── ...
├── tests/
│   ├── unit/
│   │   ├── lib/
│   │   │   └── scheduler.test.ts
│   │   ├── types/
│   │   │   └── job.test.ts
│   │   └── ...
│   ├── integration/
│   │   ├── api/
│   │   │   └── server.test.ts
│   │   ├── workers/
│   │   │   └── schedulerWorker.test.ts
│   │   └── ...
│   ├── e2e/
│   │   └── scheduler.test.ts
│   └── fixtures/
│       ├── jobs.ts
│       └── ...
│   └── setup.ts
```

## Test Types

### Unit Tests

Focus on testing individual functions and components in isolation, with dependencies mocked.

### Integration Tests

Test the interaction between components, such as the API with the database or the worker with the queue.

### End-to-End Tests

Test the entire system working together, including the API, worker, database, and queue.

## Test Cases

### Unit Tests

#### `lib/scheduler.ts`

1. **calculateInitialDelay**
   - Should return null for non-specific_time jobs
   - Should return null for specific_time jobs with missing specific_time
   - Should return null for specific_time jobs with past time
   - Should return correct delay in milliseconds for future time

2. **calculateRepeatOptions**
   - Should return null for non-cron and non-recurring jobs
   - Should return null for cron jobs with missing cron_expression
   - Should return null for recurring jobs with missing interval or interval_value
   - Should return correct cron option for valid cron jobs
   - Should return correct every option for valid recurring jobs
   - Should validate cron expressions and return null for invalid ones

3. **calculateNextRun**
   - Should return null for invalid job configurations
   - Should correctly calculate next run for cron jobs
   - Should correctly calculate next run for specific_time jobs
   - Should correctly calculate next run for recurring jobs with different intervals
   - Should handle edge cases like month/year transitions

4. **formatDate**
   - Should format date correctly without milliseconds

#### `types/job.ts`

1. **JobSchema Validation**
   - Should validate valid job inputs
   - Should reject invalid job inputs with appropriate error messages
   - Should test all required fields and constraints
   - Should test enum validations

### Integration Tests

#### `api/server.ts`

1. **Health Check Endpoint**
   - Should return 200 OK with status information

2. **Create Job Endpoint**
   - Should create a job with valid input
   - Should reject invalid job data with 400 status
   - Should handle database errors gracefully
   - Should correctly calculate next_run and store in database
   - Should add job to the queue with correct options

3. **Get Jobs Endpoint**
   - Should return all jobs
   - Should filter jobs by status
   - Should handle database errors gracefully

4. **Get Job by ID Endpoint**
   - Should return job with valid ID
   - Should return 404 for non-existent job
   - Should handle database errors gracefully

5. **Update Job Endpoint**
   - Should update job with valid input
   - Should reject invalid job data with 400 status
   - Should return 404 for non-existent job
   - Should remove old job from queue and add updated job
   - Should handle database errors gracefully

6. **Delete Job Endpoint**
   - Should delete job with valid ID
   - Should return 404 for non-existent job
   - Should remove job from queue
   - Should handle database errors gracefully

#### `workers/schedulerWorker.ts`

1. **Job Processing**
   - Should process HTTP jobs correctly
   - Should handle job not found in database
   - Should skip inactive jobs
   - Should update job status after successful execution
   - Should update error_message and status on failure
   - Should calculate and update next_run for recurring jobs
   - Should retry failed jobs according to configuration

2. **HTTP Job Execution**
   - Should make HTTP request with correct payload and headers
   - Should handle successful HTTP responses
   - Should handle HTTP request failures

### End-to-End Tests

1. **Job Lifecycle**
   - Should create, retrieve, update, and delete a job through the API
   - Should verify job execution at the scheduled time
   - Should verify job status updates after execution
   - Should verify retry behavior for failed jobs

2. **Scheduling Patterns**
   - Should test cron job execution
   - Should test specific_time job execution
   - Should test recurring job execution with different intervals

3. **Error Handling and Recovery**
   - Should test system behavior when database is temporarily unavailable
   - Should test system behavior when Redis is temporarily unavailable
   - Should test system behavior when target HTTP endpoint is unavailable

## Test Setup and Utilities

### `tests/setup.ts`

This file will contain global setup and teardown logic for tests, including:
- Setting up test environment variables
- Creating and clearing test database tables
- Setting up and clearing test Redis instance

### `tests/fixtures/jobs.ts`

This file will contain factory functions for creating test job data:
- Sample valid jobs of different types and schedules
- Sample invalid jobs for testing validation

## Running Tests

Add the following scripts to `package.json`:

```json
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test tests/unit",
    "test:integration": "bun test tests/integration",
    "test:e2e": "bun test tests/e2e",
    "test:coverage": "bun test --coverage"
  }
}
```

## Mocking Strategy

1. **Database Mocking**
   - Use pg-mem for in-memory PostgreSQL database in unit and integration tests
   - Create test database in Docker for end-to-end tests

2. **Redis/Queue Mocking**
   - Use mock-redis for unit tests
   - Create test Redis instance in Docker for integration and end-to-end tests

3. **HTTP Request Mocking**
   - Use nock to mock external HTTP requests in unit and integration tests
   - Use a simple HTTP server for end-to-end tests

## Continuous Integration

Set up CI pipeline to run tests on each pull request and merge to main branch:
1. Run unit tests
2. Run integration tests
3. Run end-to-end tests
4. Generate and report test coverage

## Test Implementation Plan

1. Start with unit tests for core functionality (scheduler.ts, job.ts)
2. Implement integration tests for API endpoints
3. Implement integration tests for worker
4. Implement end-to-end tests for complete system

This approach ensures that the core functionality is tested first, followed by the integration points, and finally the entire system.
