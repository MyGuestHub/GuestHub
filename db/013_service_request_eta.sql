BEGIN;

-- Per-request ETA set by staff (for food prep, taxi arrival, etc.)
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS eta_minutes SMALLINT,
  ADD COLUMN IF NOT EXISTS eta_set_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_service_requests_eta_set_at
  ON service_requests(eta_set_at)
  WHERE eta_set_at IS NOT NULL;

COMMIT;
