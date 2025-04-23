# PingPay Scheduler Service

A robust and flexible job scheduler service that provides a reliable way to schedule jobs to be executed at specific times or intervals. It leverages BullMQ for queue management and PostgreSQL for persistent job storage.

## Features

- **Job Scheduling**:
  - Schedule jobs using cron expressions
  - Schedule jobs for a specific time (one-time execution)
  - Schedule recurring jobs with configurable intervals (minute, hour, day, week, month, year)

- **Job Persistence**:
  - Store job definitions in a PostgreSQL database
  - Track job execution history and status

- **Job Management API**:
  - Create, read, update, and delete jobs via a RESTful API
  - Filter jobs by status

- **Queue Management**:
  - Use BullMQ to reliably enqueue and process jobs
  - Automatic job scheduling based on defined patterns

- **Retry Mechanism**:
  - Automatically retry failed jobs with exponential backoff
  - Configurable retry attempts

- **Concurrency Control**:
  - Limit the number of concurrent job executions

- **Error Handling and Logging**:
  - Detailed logging of job execution
  - Store error messages for failed jobs

- **Flexible Job Types**:
  - Support HTTP requests with custom payloads

## Technology Stack

- **Framework**: Hono (lightweight web framework)
- **Queue System**: BullMQ (Redis-based queue system)
- **Database**: PostgreSQL
- **Programming Language**: TypeScript
- **Runtime**: Bun

## Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) (for local development with containers)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)

## Environment Variables

Create a `.env` file based on the provided `.env.example`:

```
# PostgreSQL connection string
POSTGRES_URL=postgresql://username:password@host:port/database

# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379

# API server port
PORT=3000
```

## Local Development

### Setup

1. Clone the repository
2. Navigate to the scheduler directory
3. Install dependencies:

```bash
bun install
```

4. Start PostgreSQL and Redis (using Docker Compose):

```bash
docker-compose up -d postgres redis
```

5. Initialize the database:

```bash
bun run db:init
```

6. Start the API server in development mode:

```bash
bun run dev
```

7. Start the worker in development mode (in a separate terminal):

```bash
bun run dev:worker
```

### Using Docker Compose

To run the entire stack (PostgreSQL, Redis, API, and Worker) using Docker Compose:

```bash
docker-compose up -d
```

This will build and start all the services defined in the `docker-compose.yml` file.

## API Endpoints

### Health Check

```
GET /health
```

Returns the current status of the service.

### Create a Job

```
POST /jobs
```

Request body:

```json
{
  "name": "Example Job",
  "description": "An example job that sends a notification",
  "type": "http",
  "target": "https://example.com/api/notify",
  "payload": {
    "message": "Hello, world!"
  },
  "schedule_type": "recurring",
  "interval": "hour",
  "interval_value": 1
}
```

### Get All Jobs

```
GET /jobs
```

Optional query parameters:
- `status`: Filter jobs by status (`active`, `inactive`, `failed`)

### Get a Job by ID

```
GET /jobs/:id
```

### Update a Job

```
PUT /jobs/:id
```

Request body: Same as for creating a job.

### Delete a Job

```
DELETE /jobs/:id
```

## Job Types

Currently, the scheduler supports the following job types:

### HTTP

Makes an HTTP POST request to the specified target URL with the provided payload.

```json
{
  "type": "http",
  "target": "https://example.com/api/endpoint",
  "payload": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

## Schedule Types

### Cron

Uses a cron expression to define the schedule.

```json
{
  "schedule_type": "cron",
  "cron_expression": "0 * * * *"
}
```

### Specific Time

Executes the job once at a specific time.

```json
{
  "schedule_type": "specific_time",
  "specific_time": "2023-12-31T23:59:59Z"
}
```

### Recurring

Executes the job at regular intervals.

```json
{
  "schedule_type": "recurring",
  "interval": "day",
  "interval_value": 1
}
```

Available intervals: `minute`, `hour`, `day`, `week`, `month`, `year`.

## Deployment to Railway

### Prerequisites

- [Railway CLI](https://docs.railway.app/develop/cli) installed and authenticated
- A Railway account

### Steps

1. Create a new project on Railway:

```bash
railway init
```

2. Add PostgreSQL and Redis services:

```bash
railway add
```

Select PostgreSQL and Redis from the list of available plugins.

3. Link your local project to the Railway project:

```bash
railway link
```

4. Deploy the scheduler service:

```bash
railway up
```

5. Set up environment variables:

```bash
railway vars set POSTGRES_URL=<your-postgres-url> REDIS_HOST=<your-redis-host> REDIS_PORT=<your-redis-port>
```

6. Open the deployed service:

```bash
railway open
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
