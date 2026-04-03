BEGIN;

-- ─── Guest sessions (bind room QR access to a specific reservation) ─
-- When a guest scans a permanent room QR token, a session is created
-- that ties them to their specific reservation. If the reservation
-- becomes inactive (checked_out / cancelled), the session is invalid
-- and the previous guest can no longer access the portal.

CREATE TABLE IF NOT EXISTS guest_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_token VARCHAR(128) NOT NULL UNIQUE,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  room_qr_token VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_reservation ON guest_sessions(reservation_id);

COMMIT;
