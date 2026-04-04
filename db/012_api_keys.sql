/* ═══════════════════════════════════════════════════════════════════════
   012 – API Keys for external REST API access
   ═══════════════════════════════════════════════════════════════════════ */

/* ── API Keys table ── */
CREATE TABLE IF NOT EXISTS api_keys (
  id          BIGSERIAL PRIMARY KEY,
  label       VARCHAR(100)  NOT NULL,
  key_hash    VARCHAR(200)  NOT NULL UNIQUE,
  key_prefix  VARCHAR(12)   NOT NULL,              -- first 8 chars for identification
  scopes      TEXT[]        NOT NULL DEFAULT '{}',  -- e.g. {'rooms.read','reservations.read'}
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  expires_at  TIMESTAMPTZ,                          -- NULL = never expires
  last_used_at TIMESTAMPTZ,
  request_count BIGINT      NOT NULL DEFAULT 0,
  rate_limit  INT           NOT NULL DEFAULT 60,    -- requests per minute
  created_by  BIGINT        NOT NULL REFERENCES app_users(id),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;

/* ── Rate-limit tracking (sliding window) ── */
CREATE TABLE IF NOT EXISTS api_rate_limits (
  key_id      BIGINT    NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  hit_count   INT       NOT NULL DEFAULT 1,
  PRIMARY KEY (key_id, window_start)
);

/* ── API request audit log ── */
CREATE TABLE IF NOT EXISTS api_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  key_id      BIGINT        NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  method      VARCHAR(10)   NOT NULL,
  path        VARCHAR(500)  NOT NULL,
  status_code SMALLINT      NOT NULL,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  response_ms INT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_audit_created ON api_audit_log(created_at DESC);
CREATE INDEX idx_api_audit_key ON api_audit_log(key_id, created_at DESC);

/* ── Permission ── */
INSERT INTO app_permissions (permission_code, description)
VALUES ('api.manage', 'Manage API keys')
ON CONFLICT (permission_code) DO NOTHING;

/* Grant to admin role */
INSERT INTO app_role_permissions (role_id, permission_id, sort_order)
SELECT r.id, p.id, COALESCE((SELECT MAX(sort_order) FROM app_role_permissions WHERE role_id = r.id), 0) + 1
FROM app_roles r, app_permissions p
WHERE r.role_name = 'admin' AND p.permission_code = 'api.manage'
ON CONFLICT DO NOTHING;
