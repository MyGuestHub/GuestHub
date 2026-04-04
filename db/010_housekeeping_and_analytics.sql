BEGIN;

/* ═══════════════════════════════════════════════════════════════
   Housekeeping tasks - Kanban board for room cleaning workflow
   ═══════════════════════════════════════════════════════════════ */

CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL DEFAULT 'cleaning'
    CHECK (task_type IN ('cleaning','turndown','inspection','deep_clean')),
  task_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (task_status IN ('pending','in_progress','done','verified')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to BIGINT REFERENCES app_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_housekeeping_room ON housekeeping_tasks(room_id);
CREATE INDEX idx_housekeeping_status ON housekeeping_tasks(task_status);
CREATE INDEX idx_housekeeping_assigned ON housekeeping_tasks(assigned_to);

/* ═══════════════════════════════════════════════════════════════
   New permissions
   ═══════════════════════════════════════════════════════════════ */

INSERT INTO app_permissions (permission_code, description) VALUES
  ('housekeeping.manage', 'Manage housekeeping tasks and assignments'),
  ('analytics.view', 'View analytics and reports dashboard')
ON CONFLICT (permission_code) DO NOTHING;

-- Grant to admin
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON ap.permission_code IN ('housekeeping.manage', 'analytics.view')
WHERE ar.role_name = 'admin'
ON CONFLICT DO NOTHING;

-- Grant housekeeping to reception
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON ap.permission_code = 'housekeeping.manage'
WHERE ar.role_name = 'reception'
ON CONFLICT DO NOTHING;

COMMIT;
