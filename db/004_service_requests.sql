BEGIN;

-- ─── Guest access tokens (QR code links) ───────────────────────────

CREATE TABLE IF NOT EXISTS guest_access_tokens (
  id BIGSERIAL PRIMARY KEY,
  token VARCHAR(128) NOT NULL UNIQUE,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_guest_tokens_token ON guest_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_guest_tokens_reservation ON guest_access_tokens(reservation_id);

-- ─── Service request categories ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS service_categories (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(40) NOT NULL UNIQUE,
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  icon VARCHAR(40),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Service items within categories ────────────────────────────────

CREATE TABLE IF NOT EXISTS service_items (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  slug VARCHAR(60) NOT NULL UNIQUE,
  name_en VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  estimated_cost NUMERIC(10,2),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_items_category ON service_items(category_id);

-- ─── Service requests from guests ───────────────────────────────────

CREATE TABLE IF NOT EXISTS service_requests (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id),
  room_id BIGINT NOT NULL REFERENCES rooms(id),
  guest_id BIGINT NOT NULL REFERENCES guests(id),
  service_item_id BIGINT NOT NULL REFERENCES service_items(id),
  request_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (request_status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  quantity SMALLINT NOT NULL DEFAULT 1,
  estimated_cost NUMERIC(10,2),
  assigned_to BIGINT REFERENCES app_users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_reservation ON service_requests(reservation_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_room ON service_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned ON service_requests(assigned_to);

-- ─── Service request status log (audit trail) ──────────────────────

CREATE TABLE IF NOT EXISTS service_request_logs (
  id BIGSERIAL PRIMARY KEY,
  service_request_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by BIGINT REFERENCES app_users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sr_logs_request ON service_request_logs(service_request_id);

-- ─── Add new permission for service request management ──────────────

INSERT INTO app_permissions (permission_code, description)
VALUES ('services.manage', 'Manage service requests and categories')
ON CONFLICT (permission_code) DO NOTHING;

-- Grant to admin role
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON ap.permission_code = 'services.manage'
WHERE ar.role_name = 'admin'
ON CONFLICT DO NOTHING;

-- Grant to reception role
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON ap.permission_code = 'services.manage'
WHERE ar.role_name = 'reception'
ON CONFLICT DO NOTHING;

-- ─── Seed default service categories ────────────────────────────────

INSERT INTO service_categories (slug, name_en, name_ar, icon, sort_order) VALUES
  ('food_beverage',    'Food & Beverage',          'الأطعمة والمشروبات',    'FiCoffee',   1),
  ('housekeeping',     'Room Service & Housekeeping','خدمة الغرف والتنظيف', 'FiHome',     2),
  ('laundry',          'Laundry Service',           'خدمة الغسيل',          'FiDroplet',  3),
  ('facilities',       'Facilities Booking',        'حجز المرافق',          'FiCalendar', 4),
  ('maintenance',      'Maintenance & Support',     'الصيانة والدعم',       'FiTool',     5)
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed default service items ─────────────────────────────────────

-- Food & Beverage
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'breakfast_order',    'Breakfast Order',     'طلب إفطار',        'Set menu or custom breakfast', 'إفطار بقائمة محددة أو حسب الطلب', 15.00, 1),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'lunch_order',        'Lunch Order',         'طلب غداء',         'Lunch menu ordering', 'طلب من قائمة الغداء', 25.00, 2),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'dinner_order',       'Dinner Order',        'طلب عشاء',         'Dinner menu ordering', 'طلب من قائمة العشاء', 30.00, 3),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'drinks_order',       'Drinks',              'مشروبات',          'Hot, cold, or special drinks', 'مشروبات ساخنة أو باردة أو خاصة', 8.00, 4),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'special_dietary',    'Special Dietary Request','طلب غذائي خاص',  'Vegetarian, halal, allergy-specific', 'نباتي، حلال، حساسية محددة', NULL, 5)
ON CONFLICT (slug) DO NOTHING;

-- Housekeeping
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'room_cleaning',      'Room Cleaning',       'تنظيف الغرفة',     'Standard room cleaning', 'تنظيف شامل للغرفة', NULL, 1),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'fresh_towels',       'Fresh Towels/Linen',  'مناشف ومفارش نظيفة','Request fresh towels and linen', 'طلب مناشف ومفارش جديدة', NULL, 2),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'toiletries',         'Toiletries',          'مستلزمات النظافة',  'Soap, shampoo replenishment', 'تجديد الصابون والشامبو', NULL, 3),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'extra_items',        'Extra Items',         'عناصر إضافية',     'Pillows, blankets, iron, hairdryer', 'وسائد، بطانيات، مكواة، مجفف شعر', NULL, 4),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'turndown_service',   'Turn-down Service',   'خدمة تجهيز السرير','Evening bed preparation', 'تجهيز السرير المسائي', NULL, 5)
ON CONFLICT (slug) DO NOTHING;

-- Laundry
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'laundry_pickup',     'Laundry Pickup',      'استلام الغسيل',    'Standard laundry service', 'خدمة غسيل عادية', 20.00, 1),
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'dry_cleaning',       'Dry Cleaning',        'تنظيف جاف',        'Professional dry cleaning', 'تنظيف جاف احترافي', 35.00, 2),
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'express_laundry',    'Express Laundry',     'غسيل سريع',        'Same-day express laundry', 'غسيل سريع في نفس اليوم', 40.00, 3)
ON CONFLICT (slug) DO NOTHING;

-- Facilities
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'pool_booking',       'Swimming Pool',       'حجز المسبح',       'Reserve a pool time slot', 'حجز وقت في المسبح', NULL, 1),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'gym_access',         'Gym Access',          'دخول النادي الرياضي','Book gym access slot', 'حجز وقت في النادي الرياضي', NULL, 2),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'spa_appointment',    'Spa & Wellness',      'سبا وعافية',        'Book spa treatment', 'حجز جلسة سبا', 50.00, 3),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'sauna_booking',      'Sauna/Steam Room',    'ساونا/غرفة بخار',  'Book sauna or steam room', 'حجز ساونا أو غرفة بخار', 25.00, 4),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'restaurant_reservation','Restaurant Table', 'حجز طاولة مطعم',   'Reserve a restaurant table', 'حجز طاولة في المطعم', NULL, 5)
ON CONFLICT (slug) DO NOTHING;

-- Maintenance & Support
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='maintenance'), 'report_issue',       'Report Room Issue',   'بلاغ مشكلة بالغرفة','AC, lights, plumbing issues', 'مشاكل التكييف والإضاءة والسباكة', NULL, 1),
  ((SELECT id FROM service_categories WHERE slug='maintenance'), 'emergency_assist',   'Emergency Assistance','مساعدة طارئة',      'Urgent help request', 'طلب مساعدة عاجلة', NULL, 2),
  ((SELECT id FROM service_categories WHERE slug='maintenance'), 'concierge',          'Concierge Services',  'خدمات الكونسيرج',  'Taxi, recommendations, etc.', 'سيارة أجرة، توصيات، إلخ', NULL, 3)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
