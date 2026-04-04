BEGIN;

-- ═══════════════════════════════════════════════════════════
-- Guest Ratings & Reviews
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS service_request_ratings (
  id              SERIAL PRIMARY KEY,
  service_request_id INT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  reservation_id  INT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  stars           SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  emoji           TEXT CHECK (emoji IN ('love', 'happy', 'neutral', 'sad', 'angry')),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_request_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_reservation ON service_request_ratings(reservation_id);
CREATE INDEX IF NOT EXISTS idx_ratings_stars ON service_request_ratings(stars);

-- ═══════════════════════════════════════════════════════════
-- Guest preferences (dark mode, language, etc.)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE guest_sessions
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';

COMMIT;
