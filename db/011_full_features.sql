BEGIN;

/* ═══════════════════════════════════════════════════════════════
   011 — Full feature set: Cart, Chat, Invoice, DND, Wake-up,
         Favorites, Lost&Found, Complaints, Facility bookings
   ═══════════════════════════════════════════════════════════════ */

/* ── Cart items (server-side for group basket sharing) ── */
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  service_item_id BIGINT NOT NULL REFERENCES service_items(id),
  quantity SMALLINT NOT NULL DEFAULT 1,
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  added_by_guest BIGINT REFERENCES guests(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cart_reservation ON cart_items(reservation_id);

/* ── Chat messages ── */
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('guest','staff')),
  sender_guest_id BIGINT REFERENCES guests(id),
  sender_staff_id BIGINT REFERENCES app_users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_reservation ON chat_messages(reservation_id, created_at);
CREATE INDEX idx_chat_unread ON chat_messages(reservation_id, is_read) WHERE NOT is_read;

/* ── Invoices ── */
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id),
  guest_id BIGINT NOT NULL REFERENCES guests(id),
  room_id BIGINT NOT NULL REFERENCES rooms(id),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,3) NOT NULL DEFAULT 0.05,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','paid')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_invoice_reservation ON invoices(reservation_id);

CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_request_id BIGINT REFERENCES service_requests(id),
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  quantity SMALLINT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

/* ── Wake-up calls ── */
CREATE TABLE IF NOT EXISTS wake_up_calls (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  room_id BIGINT NOT NULL REFERENCES rooms(id),
  wake_time TIME NOT NULL,
  wake_date DATE NOT NULL DEFAULT CURRENT_DATE + 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','triggered','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wakeup_date ON wake_up_calls(wake_date, wake_time);

/* ── Guest favorites ── */
CREATE TABLE IF NOT EXISTS guest_favorites (
  id BIGSERIAL PRIMARY KEY,
  guest_id BIGINT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  service_item_id BIGINT NOT NULL REFERENCES service_items(id) ON DELETE CASCADE,
  order_count INT NOT NULL DEFAULT 1,
  last_ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guest_id, service_item_id)
);

/* ── Lost & Found ── */
CREATE TABLE IF NOT EXISTS lost_found_items (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT REFERENCES rooms(id),
  reported_by_guest BIGINT REFERENCES guests(id),
  reported_by_staff BIGINT REFERENCES app_users(id),
  item_description TEXT NOT NULL,
  location_found TEXT,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('electronics','clothing','documents','jewelry','luggage','other')),
  status TEXT NOT NULL DEFAULT 'reported'
    CHECK (status IN ('reported','stored','claimed','disposed')),
  photo_url TEXT,
  contact_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_lost_found_status ON lost_found_items(status);

/* ── Complaints ── */
CREATE TABLE IF NOT EXISTS complaints (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT REFERENCES reservations(id),
  guest_id BIGINT NOT NULL REFERENCES guests(id),
  room_id BIGINT REFERENCES rooms(id),
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('cleanliness','noise','service','food','facilities','staff','billing','general')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','investigating','resolved','closed')),
  assigned_to BIGINT REFERENCES app_users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_guest ON complaints(guest_id);

/* ── Facility types & bookings ── */
CREATE TABLE IF NOT EXISTS facility_types (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 10,
  slot_duration_minutes INT NOT NULL DEFAULT 60,
  open_time TIME NOT NULL DEFAULT '06:00',
  close_time TIME NOT NULL DEFAULT '22:00',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS facility_bookings (
  id BIGSERIAL PRIMARY KEY,
  facility_id BIGINT NOT NULL REFERENCES facility_types(id) ON DELETE CASCADE,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  guest_id BIGINT NOT NULL REFERENCES guests(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  guests_count SMALLINT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed','cancelled','completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_facility_booking_date ON facility_bookings(facility_id, booking_date);

/* ── DND flag on reservations ── */
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS dnd_active BOOLEAN NOT NULL DEFAULT FALSE;

/* ── Seed facility types ── */
INSERT INTO facility_types (slug, name_en, name_ar, capacity, slot_duration_minutes, open_time, close_time) VALUES
  ('swimming_pool', 'Swimming Pool',     'حمام السباحة',     20, 60,  '06:00', '22:00'),
  ('gym',           'Fitness Center',    'مركز اللياقة',      15, 60,  '05:00', '23:00'),
  ('spa',           'Spa & Wellness',    'السبا والعافية',    8,  90,  '09:00', '21:00'),
  ('sauna',         'Sauna & Steam',     'الساونا والبخار',   6,  30,  '08:00', '22:00'),
  ('tennis',        'Tennis Court',      'ملعب التنس',        4,  60,  '06:00', '21:00'),
  ('kids_club',     'Kids Club',         'نادي الأطفال',      12, 120, '08:00', '20:00'),
  ('meeting_room',  'Meeting Room',      'غرفة الاجتماعات',   20, 60,  '07:00', '22:00'),
  ('restaurant',    'Restaurant',        'المطعم',            40, 90,  '07:00', '23:00')
ON CONFLICT (slug) DO NOTHING;

/* ── New permissions ── */
INSERT INTO app_permissions (permission_code, description) VALUES
  ('chat.manage',       'View and respond to guest chat messages'),
  ('billing.manage',    'Manage invoices and billing'),
  ('complaints.manage', 'Handle guest complaints'),
  ('lost_found.manage', 'Manage lost and found items'),
  ('facilities.manage', 'Manage facility bookings')
ON CONFLICT (permission_code) DO NOTHING;

-- Grant all to admin
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON ap.permission_code IN (
  'chat.manage','billing.manage','complaints.manage','lost_found.manage','facilities.manage'
)
WHERE ar.role_name = 'admin'
ON CONFLICT DO NOTHING;

-- Grant chat + complaints + facilities to reception
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM app_roles ar
JOIN app_permissions ap ON ap.permission_code IN (
  'chat.manage','complaints.manage','facilities.manage'
)
WHERE ar.role_name = 'reception'
ON CONFLICT DO NOTHING;

COMMIT;
