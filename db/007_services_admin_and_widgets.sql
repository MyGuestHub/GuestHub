BEGIN;

-- ─── Estimated duration on service items ────────────────────────────
ALTER TABLE service_items
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes SMALLINT;

-- ─── Dashboard widgets settings ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS dashboard_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(60) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_by BIGINT REFERENCES app_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default world clock settings
INSERT INTO dashboard_settings (setting_key, setting_value)
VALUES (
  'world_clocks',
  '[
    {"city_en": "New York", "city_ar": "نيويورك", "timezone": "America/New_York"},
    {"city_en": "London", "city_ar": "لندن", "timezone": "Europe/London"},
    {"city_en": "Dubai", "city_ar": "دبي", "timezone": "Asia/Dubai"},
    {"city_en": "Tokyo", "city_ar": "طوكيو", "timezone": "Asia/Tokyo"}
  ]'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- Seed default weather widget settings
INSERT INTO dashboard_settings (setting_key, setting_value)
VALUES (
  'weather_locations',
  '[
    {"city_en": "Dubai", "city_ar": "دبي", "lat": 25.2048, "lon": 55.2708},
    {"city_en": "London", "city_ar": "لندن", "lat": 51.5074, "lon": -0.1278},
    {"city_en": "Paris", "city_ar": "باريس", "lat": 48.8566, "lon": 2.3522}
  ]'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- ─── Permission for widget/settings management ──────────────────────

INSERT INTO app_permissions (permission_code, description)
VALUES ('settings.manage', 'Manage dashboard settings and widgets')
ON CONFLICT (permission_code) DO NOTHING;

-- Grant to admin role
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON ap.permission_code = 'settings.manage'
WHERE ar.role_name = 'admin'
ON CONFLICT DO NOTHING;

COMMIT;
