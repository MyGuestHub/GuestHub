BEGIN;

CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES app_users(id)
);

CREATE TABLE IF NOT EXISTS app_roles (
  id BIGSERIAL PRIMARY KEY,
  role_name VARCHAR(60) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_permissions (
  id BIGSERIAL PRIMARY KEY,
  permission_code VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_role_permissions (
  role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES app_permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS app_user_roles (
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by BIGINT REFERENCES app_users(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS app_sessions (
  session_token VARCHAR(128) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

CREATE TABLE IF NOT EXISTS guests (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  phone VARCHAR(40),
  email VARCHAR(160),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES app_users(id)
);

CREATE TABLE IF NOT EXISTS rooms (
  id BIGSERIAL PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL UNIQUE,
  floor SMALLINT,
  room_type VARCHAR(40) NOT NULL DEFAULT 'standard',
  capacity SMALLINT NOT NULL DEFAULT 2,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES app_users(id)
);

CREATE TABLE IF NOT EXISTS reservations (
  id BIGSERIAL PRIMARY KEY,
  guest_id BIGINT NOT NULL REFERENCES guests(id),
  room_id BIGINT NOT NULL REFERENCES rooms(id),
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  reservation_status VARCHAR(20) NOT NULL DEFAULT 'checked_in' CHECK (
    reservation_status IN ('booked', 'checked_in', 'checked_out', 'cancelled')
  ),
  adults SMALLINT NOT NULL DEFAULT 1,
  children SMALLINT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES app_users(id),
  CONSTRAINT check_dates_valid CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON app_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON app_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON app_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_range ON reservations(room_id, check_in, check_out);

CREATE OR REPLACE VIEW room_live_status AS
SELECT
  r.id,
  r.room_number,
  r.floor,
  r.room_type,
  r.capacity,
  r.status,
  CASE
    WHEN r.status <> 'active' THEN 'maintenance'
    WHEN EXISTS (
      SELECT 1
      FROM reservations re
      WHERE re.room_id = r.id
        AND re.reservation_status IN ('booked', 'checked_in')
        AND NOW() >= re.check_in
        AND NOW() < re.check_out
    ) THEN 'occupied'
    ELSE 'available'
  END AS live_status
FROM rooms r;

COMMIT;
