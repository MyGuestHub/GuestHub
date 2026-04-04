BEGIN;

-- Cancellation tracking columns
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS cancelled_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by_guest  BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
