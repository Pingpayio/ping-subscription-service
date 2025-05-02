# Scheduler Service

A robust and flexible job scheduler service that provides a reliable way to schedule jobs to be executed at specific times or intervals. It leverages BullMQ for queue management and PostgreSQL for persistent job storage.

## Technical Architecture

### Components

1. **API Server (Hono)**
   - Handles HTTP requests for job management
   - Serves web interface for job management
   - Validates job configurations
   - Manages job persistence in PostgreSQL
   - Enqueues jobs in BullMQ

2. **Worker Process**
   - Processes jobs from BullMQ queues
   - Executes HTTP requests to target endpoints
   - Handles retries and error reporting
   - Updates job status in PostgreSQL

### Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as API Server
    participant DB as PostgreSQL
    participant Queue as BullMQ
    participant Worker
    participant Target as Target System

    Client->>+API: POST /jobs {<br/>  name: "Example Job",<br/>  target: "https://api.example.com",<br/>  payload: { data: "value" }<br/>}
    API->>API: Validate job config
    API->>+DB: Store job definition
    DB-->>-API: Job stored
    API->>+Queue: Enqueue job with<br/>target & payload
    Queue-->>-API: Job enqueued
    API-->>-Client: Job created response

    Note over Queue: Job scheduled time reached

    Queue->>+Worker: Dequeue job
    Worker->>Worker: Process job
    Worker->>+Target: POST request with payload
    Target-->>-Worker: Response
    Worker->>+DB: Update job status<br/>& execution results
    DB-->>-Worker: Status updated
    Worker-->>-Queue: Job completed
```

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Setup
1. Clone the repository
2. Create `.env` file from `.env.example`
3. Start services:
```bash
docker compose up --build
```

The web interface will be available at `http://localhost:3000`

## API Usage

### Create Job
```http
POST /jobs
Content-Type: application/json

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

#### List Jobs
```http
GET /jobs?status=active
```
Query Parameters:
- `status`: Filter by status (`active`, `inactive`, `failed`)

#### Get Job
```http
GET /jobs/:id
```

#### Update Job
```http
PUT /jobs/:id
Content-Type: application/json

{
  // Same schema as Create Job
}
```

#### Delete Job
```http
DELETE /jobs/:id
```

### Job Configuration

#### Schedule Types

1. **Cron**
```json
{
  "schedule_type": "cron",
  "cron_expression": "0 * * * *"
}
```

2. **Specific Time**
```json
{
  "schedule_type": "specific_time",
  "specific_time": "2023-12-31T23:59:59Z"
}
```

3. **Recurring**
```json
{
  "schedule_type": "recurring",
  "interval": "day",  // minute, hour, day, week, month, year
  "interval_value": 1
}
```
Available intervals: `minute`, `hour`, `day`, `week`, `month`, `year`

#### Job Types

Currently supports HTTP jobs:
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

## Database Schema

### Jobs Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  target TEXT NOT NULL,
  payload JSONB,
  cron_expression VARCHAR(100),
  schedule_type VARCHAR(50) NOT NULL,
  specific_time TIMESTAMP WITH TIME ZONE,
  interval VARCHAR(50),
  interval_value INTEGER,
  next_run TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

```bash
# PostgreSQL connection string
POSTGRES_URL=postgresql://username:password@host:port/database

# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379

# API server port
PORT=3000

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
ALLOWED_TARGET_HOSTS=*.example.com,api.another-domain.com
```
