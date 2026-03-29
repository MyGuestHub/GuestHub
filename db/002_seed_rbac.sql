BEGIN;

INSERT INTO app_permissions (permission_code, description)
VALUES
  ('users.manage', 'Create and manage staff users'),
  ('roles.manage', 'Manage roles and role permissions'),
  ('guests.manage', 'Create and manage guests and reservations'),
  ('rooms.manage', 'Create and manage rooms'),
  ('occupancy.view', 'View occupancy and room status dashboard')
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO app_roles (role_name, description, is_system)
VALUES
  ('admin', 'Full administrative access', TRUE),
  ('reception', 'Front desk access for guest and booking operations', TRUE),
  ('viewer', 'Read-only occupancy access', TRUE)
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON TRUE
WHERE ar.role_name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON ap.permission_code IN ('guests.manage', 'rooms.manage', 'occupancy.view')
WHERE ar.role_name = 'reception'
ON CONFLICT DO NOTHING;

INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON ap.permission_code IN ('occupancy.view')
WHERE ar.role_name = 'viewer'
ON CONFLICT DO NOTHING;

COMMIT;
