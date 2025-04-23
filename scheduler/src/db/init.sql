CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'http'
  target VARCHAR(255) NOT NULL, -- URL
  payload JSONB,
  cron_expression VARCHAR(255),
  schedule_type VARCHAR(50) NOT NULL, -- 'cron', 'specific_time', 'recurring'
  specific_time TIMESTAMPTZ,
  interval VARCHAR(50),  -- 'minute', 'hour', 'day', 'week', 'month', 'year'
  interval_value INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  error_message TEXT
);

-- Index for efficient querying of jobs by next_run
CREATE INDEX IF NOT EXISTS idx_jobs_next_run ON jobs (next_run);
-- Index for querying jobs by status
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
