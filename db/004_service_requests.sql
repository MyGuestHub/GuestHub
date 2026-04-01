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
  ('food_beverage',    'Food & Beverage',            'الأطعمة والمشروبات',       'FiCoffee',      1),
  ('housekeeping',     'Housekeeping & Room Comfort', 'خدمة الغرف والتنظيف',     'FiHome',        2),
  ('laundry',          'Laundry & Personal Care',     'الغسيل والعناية الشخصية',  'FiDroplet',     3),
  ('facilities',       'Facilities & Recreation',     'المرافق والترفيه',         'FiCalendar',    4),
  ('transport',        'Travel & Transport',          'السفر والنقل',             'FiNavigation',  5),
  ('wellness',         'Wellness & Personal',         'العافية والعناية',          'FiHeart',       6),
  ('stay_management',  'Reservation & Stay',          'إدارة الإقامة',            'FiFileText',    7),
  ('maintenance',      'Maintenance & Support',       'الصيانة والدعم',           'FiTool',        8),
  ('business',         'Business & Work',             'الأعمال والعمل',           'FiBriefcase',   9),
  ('entertainment',    'Entertainment & Digital',      'الترفيه والرقمية',         'FiMonitor',    10),
  ('communication',    'Communication',               'التواصل',                  'FiMessageSquare',11),
  ('room_settings',    'Room Settings',               'إعدادات الغرفة',           'FiSettings',   12),
  ('safety',           'Safety & Emergency',          'السلامة والطوارئ',          'FiShield',     13),
  ('convenience',      'Convenience & Miscellaneous', 'الراحة والخدمات المتنوعة',  'FiPackage',    14),
  ('feedback',         'Feedback & Rating',           'التقييم والملاحظات',        'FiStar',       15)
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed default service items ─────────────────────────────────────

-- 1. Food & Beverage
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'breakfast_order',    'Breakfast Order',           'طلب إفطار',           'Set menu or custom breakfast',          'إفطار بقائمة محددة أو حسب الطلب',     15.00,  1),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'lunch_order',        'Lunch Order',               'طلب غداء',            'Lunch menu ordering',                   'طلب من قائمة الغداء',                 25.00,  2),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'dinner_order',       'Dinner Order',              'طلب عشاء',            'Dinner menu ordering',                  'طلب من قائمة العشاء',                 30.00,  3),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'drinks_order',       'Drinks',                    'مشروبات',             'Hot, cold, or special drinks',          'مشروبات ساخنة أو باردة أو خاصة',      8.00,  4),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'minibar',            'Minibar Service',           'خدمة الميني بار',      'Minibar refill or items',               'تجديد أو طلب من الميني بار',          NULL,   5),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'special_dietary',    'Special Dietary Request',   'طلب غذائي خاص',       'Halal, vegetarian, allergy-specific',   'حلال، نباتي، حساسية محددة',           NULL,   6),
  ((SELECT id FROM service_categories WHERE slug='food_beverage'), 'special_occasion',   'Special Occasion Package',  'باقة مناسبة خاصة',    'Birthday or anniversary setup',         'ترتيب عيد ميلاد أو ذكرى سنوية',      50.00,  7)
ON CONFLICT (slug) DO NOTHING;

-- 2. Housekeeping & Room Comfort
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'room_cleaning',      'Room Cleaning',             'تنظيف الغرفة',        'Standard room cleaning',                'تنظيف شامل للغرفة',                   NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'fresh_towels',       'Fresh Towels & Linen',      'مناشف ومفارش نظيفة',  'Request fresh towels and bed linen',    'طلب مناشف ومفارش جديدة',              NULL,  2),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'toiletries',         'Toiletries',                'مستلزمات النظافة',    'Soap, shampoo, tissues replenishment',  'تجديد الصابون والشامبو والمناديل',    NULL,  3),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'turndown_service',   'Turn-down Service',         'خدمة تجهيز السرير',   'Evening bed preparation',               'تجهيز السرير المسائي',                NULL,  4),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'extra_pillows',      'Extra Pillows & Blankets',  'وسائد وبطانيات إضافية','Additional pillows or blankets',        'وسائد أو بطانيات إضافية',             NULL,  5),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'room_adjustments',   'Room Adjustments',          'تعديلات الغرفة',      'Lighting, temperature, furniture',       'إضاءة، درجة الحرارة، الأثاث',         NULL,  6),
  ((SELECT id FROM service_categories WHERE slug='housekeeping'), 'urgent_cleaning',    'Urgent Cleaning',           'تنظيف عاجل',          'High priority quick cleaning',          'تنظيف سريع ذو أولوية عالية',          NULL,  7)
ON CONFLICT (slug) DO NOTHING;

-- 3. Laundry & Personal Care
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'laundry_pickup',     'Laundry Service',           'خدمة الغسيل',         'Clothes collected and washed',          'جمع وغسل الملابس',                    20.00, 1),
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'dry_cleaning',       'Dry Cleaning',              'تنظيف جاف',           'Professional dry cleaning',             'تنظيف جاف احترافي',                   35.00, 2),
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'ironing_service',    'Ironing Service',           'خدمة الكي',           'Clothes ironed and delivered',           'كي وتسليم الملابس',                   15.00, 3),
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'express_laundry',    'Express Laundry',           'غسيل سريع',           'Same-day express service',              'خدمة سريعة في نفس اليوم',             40.00, 4),
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'grooming_items',     'Personal Grooming Items',   'أدوات العناية الشخصية','Shaving kit, toiletries',               'أدوات حلاقة ومستلزمات',               NULL,  5),
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'shoe_cleaning',      'Shoe Cleaning',             'تنظيف الأحذية',       'Shoe cleaning / shoeshine service',     'خدمة تنظيف وتلميع الأحذية',           10.00, 6),
  ((SELECT id FROM service_categories WHERE slug='laundry'), 'hairdryer_request',  'Hairdryer Request',         'طلب مجفف شعر',        'Request a hairdryer to room',           'طلب مجفف شعر للغرفة',                 NULL,  7)
ON CONFLICT (slug) DO NOTHING;

-- 4. Facilities & Recreation
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'pool_booking',       'Swimming Pool',             'حجز المسبح',          'Reserve a pool time slot',              'حجز وقت في المسبح',                   NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'gym_access',         'Gym Access',                'دخول النادي الرياضي', 'Book gym access slot',                  'حجز وقت في النادي الرياضي',            NULL,  2),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'spa_appointment',    'Spa & Wellness',            'سبا وعافية',          'Book spa treatment',                    'حجز جلسة سبا',                        50.00, 3),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'sauna_booking',      'Sauna / Steam Room',        'ساونا / غرفة بخار',   'Book sauna or steam room',              'حجز ساونا أو غرفة بخار',              25.00, 4),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'sports_booking',     'Tennis / Golf / Squash',    'تنس / جولف / اسكواش', 'Book court or tee time',                'حجز ملعب أو وقت لعب',                 30.00, 5),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'kids_club',          'Kids Club / Babysitting',   'نادي الأطفال',        'Kids activities or babysitting',        'أنشطة أطفال أو خدمة مربية',            20.00, 6),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'outdoor_activities', 'Outdoor Activities',        'أنشطة خارجية',        'Biking, kayaking, guided tours',         'دراجات، كاياك، جولات سياحية',         NULL,  7),
  ((SELECT id FROM service_categories WHERE slug='facilities'), 'restaurant_reservation','Restaurant Reservation', 'حجز مطعم',            'Reserve a restaurant table',            'حجز طاولة في المطعم',                 NULL,  8)
ON CONFLICT (slug) DO NOTHING;

-- 5. Travel & Transport
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='transport'), 'taxi_request',       'Taxi / Ride Request',       'طلب سيارة أجرة',      'Request Uber, Careem, or taxi',          'طلب أوبر أو كريم أو تاكسي',           NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='transport'), 'airport_transfer',   'Airport Transfer',          'نقل إلى المطار',      'Scheduled airport transfer',             'نقل مجدول إلى المطار',                40.00, 2),
  ((SELECT id FROM service_categories WHERE slug='transport'), 'private_chauffeur',  'Private Chauffeur',         'سائق خاص',            'Book a private driver',                  'حجز سائق خاص',                        80.00, 3),
  ((SELECT id FROM service_categories WHERE slug='transport'), 'guided_tours',       'Guided Tours & Excursions', 'جولات سياحية',        'Local tours and excursions',             'جولات محلية ورحلات سياحية',            NULL,  4),
  ((SELECT id FROM service_categories WHERE slug='transport'), 'car_rental',         'Car Rental',                'تأجير سيارة',         'Request a rental car',                   'طلب سيارة إيجار',                     NULL,  5)
ON CONFLICT (slug) DO NOTHING;

-- 6. Wellness & Personal
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='wellness'), 'massage',            'Massage',                   'مساج',               'Book a massage session',                 'حجز جلسة مساج',                       60.00, 1),
  ((SELECT id FROM service_categories WHERE slug='wellness'), 'fitness_trainer',    'Fitness Trainer',           'مدرب لياقة',          'Personal fitness trainer session',        'جلسة مدرب لياقة شخصي',                40.00, 2),
  ((SELECT id FROM service_categories WHERE slug='wellness'), 'yoga_meditation',    'Yoga / Meditation',         'يوغا / تأمل',         'In-room yoga or meditation session',     'جلسة يوغا أو تأمل في الغرفة',          30.00, 3),
  ((SELECT id FROM service_categories WHERE slug='wellness'), 'beauty_services',    'Beauty Services',           'خدمات التجميل',       'Manicure, pedicure, hairdresser',         'مناكير، بديكير، حلاق',                 35.00, 4)
ON CONFLICT (slug) DO NOTHING;

-- 7. Reservation & Stay Management
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='stay_management'), 'extend_stay',        'Extend Stay',               'تمديد الإقامة',       'Request to extend your reservation',     'طلب تمديد الحجز',                     NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='stay_management'), 'early_checkin',      'Early Check-in',            'دخول مبكر',           'Request early check-in',                 'طلب تسجيل دخول مبكر',                 NULL,  2),
  ((SELECT id FROM service_categories WHERE slug='stay_management'), 'late_checkout',      'Late Check-out',            'خروج متأخر',          'Request late check-out',                 'طلب تسجيل خروج متأخر',                NULL,  3),
  ((SELECT id FROM service_categories WHERE slug='stay_management'), 'request_checkout',   'Request Check-out',         'طلب إنهاء الإقامة',   'End your stay',                          'إنهاء الإقامة',                        NULL,  4),
  ((SELECT id FROM service_categories WHERE slug='stay_management'), 'request_invoice',    'Request Invoice',           'طلب فاتورة',          'Send billing statement to guest',         'إرسال كشف حساب للضيف',                NULL,  5)
ON CONFLICT (slug) DO NOTHING;

-- 8. Maintenance & Support
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='maintenance'), 'ac_issue',           'Air Conditioning Issue',    'مشكلة تكييف',         'Report AC problem',                      'الإبلاغ عن مشكلة في التكييف',          NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='maintenance'), 'electrical_issue',   'Electrical Issue',          'مشكلة كهربائية',      'Lighting, switches problems',            'مشاكل الإضاءة والمفاتيح',              NULL,  2),
  ((SELECT id FROM service_categories WHERE slug='maintenance'), 'plumbing_issue',     'Plumbing Issue',            'مشكلة سباكة',         'Water, bathroom, sink issues',            'مشاكل المياه والحمام والحوض',          NULL,  3),
  ((SELECT id FROM service_categories WHERE slug='maintenance'), 'wifi_issue',         'Internet / Wi-Fi Issue',    'مشكلة إنترنت',        'Weak or disconnected Wi-Fi',              'واي فاي ضعيف أو منقطع',               NULL,  4),
  ((SELECT id FROM service_categories WHERE slug='maintenance'), 'emergency_assist',   'Emergency Assistance',      'مساعدة طارئة',        'Urgent help request',                    'طلب مساعدة عاجلة',                    NULL,  5)
ON CONFLICT (slug) DO NOTHING;

-- 9. Business & Work
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='business'), 'meeting_room',       'Meeting Room Booking',      'حجز قاعة اجتماعات',   'Book a meeting room',                    'حجز غرفة اجتماعات',                   NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='business'), 'printing_service',   'Printing & Copying',        'طباعة ونسخ',          'Printing, photocopying, fax',             'طباعة ونسخ وفاكس',                     5.00, 2),
  ((SELECT id FROM service_categories WHERE slug='business'), 'wifi_upgrade',       'High-Speed Internet',       'إنترنت عالي السرعة',   'Wi-Fi upgrade or extension',              'ترقية أو تمديد الواي فاي',            10.00, 3),
  ((SELECT id FROM service_categories WHERE slug='business'), 'equipment_rental',   'Laptop / Projector Rental', 'تأجير لابتوب / بروجكتور','Rent laptop or projector',              'استئجار لابتوب أو جهاز عرض',           20.00, 4)
ON CONFLICT (slug) DO NOTHING;

-- 10. Entertainment & Digital
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='entertainment'), 'streaming',          'In-Room Streaming',         'بث داخل الغرفة',      'Netflix, Disney+, Spotify access',        'وصول نتفلكس، ديزني+، سبوتيفاي',      NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='entertainment'), 'gaming_vr',          'Gaming / VR Headset',       'ألعاب / واقع افتراضي','Request gaming console or VR',             'طلب جهاز ألعاب أو واقع افتراضي',       15.00, 2),
  ((SELECT id FROM service_categories WHERE slug='entertainment'), 'newspapers',         'Newspapers & Magazines',    'صحف ومجلات',          'Daily newspapers or magazines',            'صحف يومية أو مجلات',                  NULL,  3)
ON CONFLICT (slug) DO NOTHING;

-- 11. Communication
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='communication'), 'chat_reception',     'Chat with Reception',       'محادثة مع الاستقبال', 'Direct messaging with front desk',        'رسائل مباشرة مع مكتب الاستقبال',       NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='communication'), 'submit_complaint',   'Submit Complaint',          'تقديم شكوى',         'Send feedback or complaint',              'إرسال ملاحظات أو شكوى',               NULL,  2),
  ((SELECT id FROM service_categories WHERE slug='communication'), 'concierge',          'Concierge Services',        'خدمات الكونسيرج',    'Recommendations, assistance',             'توصيات ومساعدة',                       NULL,  3)
ON CONFLICT (slug) DO NOTHING;

-- 12. Room Settings
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='room_settings'), 'dnd_mode',           'Do Not Disturb',            'عدم الإزعاج',        'Prevent staff from entering',             'منع الموظفين من الدخول',               NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='room_settings'), 'wakeup_call',        'Wake-up Call',              'مكالمة إيقاظ',       'Set a wake-up call at specific time',     'ضبط مكالمة إيقاظ في وقت محدد',          NULL,  2)
ON CONFLICT (slug) DO NOTHING;

-- 13. Safety & Emergency
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='safety'), 'emergency_medical',  'Emergency Medical',         'مساعدة طبية طارئة',   'Request emergency medical help',          'طلب مساعدة طبية عاجلة',               NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='safety'), 'security_request',   'Security Request',          'طلب أمن',             'Security escort or assistance',            'مرافقة أمنية أو مساعدة',               NULL,  2),
  ((SELECT id FROM service_categories WHERE slug='safety'), 'lost_found',         'Lost & Found',              'المفقودات',            'Report lost or found items',               'الإبلاغ عن أغراض مفقودة',              NULL,  3)
ON CONFLICT (slug) DO NOTHING;

-- 14. Convenience & Miscellaneous
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='convenience'), 'luggage_service',    'Luggage Storage & Delivery','تخزين وتوصيل الأمتعة','Luggage storage or room delivery',        'تخزين أو توصيل الأمتعة للغرفة',        NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='convenience'), 'flower_gift',        'Flower / Gift Delivery',    'توصيل ورد / هدايا',  'Send flowers or gifts to room',           'إرسال ورد أو هدايا للغرفة',            NULL,  2),
  ((SELECT id FROM service_categories WHERE slug='convenience'), 'currency_exchange',  'Currency Exchange',         'صرف عملات',           'Currency exchange or banking help',        'صرف عملات أو مساعدة بنكية',            NULL,  3),
  ((SELECT id FROM service_categories WHERE slug='convenience'), 'baggage_pickup',     'Early Baggage Pickup',      'استلام أمتعة مبكر',   'Pre-departure baggage collection',        'جمع الأمتعة قبل المغادرة',             NULL,  4),
  ((SELECT id FROM service_categories WHERE slug='convenience'), 'pet_services',       'Pet Services',              'خدمات الحيوانات',     'Pet care and assistance',                 'رعاية ومساعدة الحيوانات الأليفة',       NULL,  5)
ON CONFLICT (slug) DO NOTHING;

-- 15. Feedback & Rating
INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='feedback'), 'rate_service',       'Rate Service',              'تقييم الخدمة',        'Rate a staff member or service',           'تقييم موظف أو خدمة',                  NULL,  1),
  ((SELECT id FROM service_categories WHERE slug='feedback'), 'room_setup_request', 'Personalised Room Setup',   'ترتيب غرفة مخصص',    'Request custom room arrangements',         'طلب ترتيبات غرفة مخصصة',              NULL,  2),
  ((SELECT id FROM service_categories WHERE slug='feedback'), 'post_stay_review',   'Post-Stay Review',          'تقييم بعد الإقامة',   'Submit your stay feedback',                'تقديم ملاحظاتك عن الإقامة',            NULL,  3)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
