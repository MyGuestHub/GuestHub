BEGIN;

-- ─── Permanent QR tokens per room ───────────────────────────────────
-- Each room gets a permanent token that never expires.
-- When scanned, the system finds the active reservation for that room.

CREATE TABLE IF NOT EXISTS room_qr_tokens (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
  token VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_qr_token ON room_qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_room_qr_room ON room_qr_tokens(room_id);

COMMIT;
