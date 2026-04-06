import { query } from "@/lib/db";

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

export type Paginated<T> = {
  rows: T[];
  pagination: Pagination;
};

export type RoomLive = {
  id: number;
  room_number: string;
  floor: number | null;
  room_type: string;
  capacity: number;
  status: string;
  live_status: "available" | "occupied" | "maintenance";
  notification_count?: number;
};

export type GuestWithRoom = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  room_number: string | null;
  check_in: string | null;
  check_out: string | null;
};

export type StaffUser = {
  id: number;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  roles: string[];
};

export type ReservationRow = {
  id: number;
  guest_id: number;
  room_id: number;
  guest_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  reservation_status: "booked" | "checked_in" | "checked_out" | "cancelled";
  sort_order: number;
};

export type ReservationBoardRow = ReservationRow;

export type Permission = {
  id: number;
  permission_code: string;
  description: string | null;
};

export type RoleOption = {
  id: number;
  role_name: string;
  description: string | null;
};

export type RolePermission = {
  role_id: number;
  permission_id: number;
  permission_code: string;
  description: string | null;
  sort_order: number;
};

export type GuestOption = {
  id: number;
  full_name: string;
};

export type UserProfile = {
  id: number;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  roles: string[];
  role_ids: number[];
};

export type RoomStats = {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
};

function safeOffset(page: number, pageSize: number) {
  const p = Number.isFinite(page) && page > 0 ? page : 1;
  const size = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
  return {
    page: p,
    pageSize: size,
    offset: (p - 1) * size,
  };
}

async function countRows(table: "rooms" | "guests" | "app_users" | "reservations") {
  const result = await query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ${table}`);
  return Number(result.rows[0]?.total ?? "0");
}

export async function listRoomStatus(): Promise<RoomLive[]> {
  const result = await query<RoomLive>(
    `
    SELECT
      id,
      room_number,
      floor,
      room_type,
      capacity,
      status,
      live_status,
      CASE WHEN live_status = 'maintenance' THEN 1 ELSE 0 END AS notification_count
    FROM room_live_status
    ORDER BY notification_count DESC, room_number
    `,
  );
  return result.rows;
}

export async function getRoomStats(): Promise<RoomStats> {
  const result = await query<{ status: RoomLive["live_status"]; total: string }>(
    `
    SELECT live_status AS status, COUNT(*)::text AS total
    FROM room_live_status
    GROUP BY live_status
    `,
  );

  const stats: RoomStats = {
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
  };

  for (const row of result.rows) {
    const value = Number(row.total);
    stats.total += value;
    if (row.status === "available") stats.available = value;
    if (row.status === "occupied") stats.occupied = value;
    if (row.status === "maintenance") stats.maintenance = value;
  }

  return stats;
}

export async function listRoomsPaginated(page: number, pageSize: number): Promise<Paginated<RoomLive>> {
  const pager = safeOffset(page, pageSize);
  const total = await countRows("rooms");

  const result = await query<RoomLive>(
    `
    SELECT id, room_number, floor, room_type, capacity, status, live_status
    FROM room_live_status
    ORDER BY room_number
    LIMIT $1 OFFSET $2
    `,
    [pager.pageSize, pager.offset],
  );

  return {
    rows: result.rows,
    pagination: {
      page: pager.page,
      pageSize: pager.pageSize,
      total,
    },
  };
}

export async function listGuestsPaginated(page: number, pageSize: number): Promise<Paginated<GuestWithRoom>> {
  const pager = safeOffset(page, pageSize);
  const total = await countRows("guests");

  const result = await query<GuestWithRoom>(
    `
    SELECT
      g.id,
      g.first_name,
      g.last_name,
      g.phone,
      g.email,
      r.room_number,
      re.check_in::text,
      re.check_out::text
    FROM guests g
    LEFT JOIN LATERAL (
      SELECT re1.room_id, re1.check_in, re1.check_out
      FROM reservations re1
      WHERE re1.guest_id = g.id
      ORDER BY re1.created_at DESC
      LIMIT 1
    ) re ON TRUE
    LEFT JOIN rooms r ON r.id = re.room_id
    ORDER BY g.created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [pager.pageSize, pager.offset],
  );

  return {
    rows: result.rows,
    pagination: {
      page: pager.page,
      pageSize: pager.pageSize,
      total,
    },
  };
}

export async function listUsersPaginated(page: number, pageSize: number): Promise<Paginated<StaffUser>> {
  const pager = safeOffset(page, pageSize);
  const total = await countRows("app_users");

  const result = await query<{
    id: number;
    username: string;
    full_name: string;
    avatar_url: string | null;
    is_active: boolean;
    role_name: string | null;
  }>(
    `
    SELECT
      u.id,
      u.username,
      u.full_name,
      u.avatar_url,
      u.is_active,
      r.role_name
    FROM app_users u
    LEFT JOIN app_user_roles ur ON ur.user_id = u.id
    LEFT JOIN app_roles r ON r.id = ur.role_id
    WHERE u.id IN (
      SELECT id
      FROM app_users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    )
    ORDER BY u.created_at DESC
    `,
    [pager.pageSize, pager.offset],
  );

  const byUser = new Map<number, StaffUser>();
  for (const row of result.rows) {
    const existing = byUser.get(row.id);
    if (existing) {
      if (row.role_name && !existing.roles.includes(row.role_name)) {
        existing.roles.push(row.role_name);
      }
      continue;
    }
    byUser.set(row.id, {
      id: row.id,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      is_active: row.is_active,
      roles: row.role_name ? [row.role_name] : [],
    });
  }

  return {
    rows: [...byUser.values()],
    pagination: {
      page: pager.page,
      pageSize: pager.pageSize,
      total,
    },
  };
}

export async function listReservationsPaginated(
  page: number,
  pageSize: number,
): Promise<Paginated<ReservationRow>> {
  const pager = safeOffset(page, pageSize);
  const total = await countRows("reservations");

  const result = await query<ReservationRow>(
    `
    SELECT
      re.id,
      re.guest_id,
      re.room_id,
      g.first_name || ' ' || g.last_name AS guest_name,
      r.room_number,
      re.check_in::text,
      re.check_out::text,
      re.reservation_status,
      re.sort_order
    FROM reservations re
    JOIN guests g ON g.id = re.guest_id
    JOIN rooms r ON r.id = re.room_id
    ORDER BY re.created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [pager.pageSize, pager.offset],
  );

  return {
    rows: result.rows,
    pagination: {
      page: pager.page,
      pageSize: pager.pageSize,
      total,
    },
  };
}

export async function listReservationsBoard(): Promise<ReservationBoardRow[]> {
  const result = await query<ReservationBoardRow>(
    `
    SELECT
      re.id,
      re.guest_id,
      re.room_id,
      g.first_name || ' ' || g.last_name AS guest_name,
      r.room_number,
      re.check_in::text,
      re.check_out::text,
      re.reservation_status,
      re.sort_order
    FROM reservations re
    JOIN guests g ON g.id = re.guest_id
    JOIN rooms r ON r.id = re.room_id
    ORDER BY re.reservation_status, re.sort_order, re.created_at DESC
    `,
  );

  return result.rows;
}

export async function listRoles(): Promise<RoleOption[]> {
  const result = await query<RoleOption>(
    `
    SELECT id::int AS id, role_name, description
    FROM app_roles
    ORDER BY role_name
    `,
  );
  return result.rows;
}

export async function listPermissions(): Promise<Permission[]> {
  const result = await query<Permission>(
    `SELECT id::int AS id, permission_code, description FROM app_permissions ORDER BY permission_code`,
  );
  return result.rows;
}

export async function listRolePermissions(roleId: number): Promise<RolePermission[]> {
  const result = await query<RolePermission>(
    `
    SELECT
      rp.role_id::int AS role_id,
      rp.permission_id::int AS permission_id,
      p.permission_code,
      p.description,
      rp.sort_order
    FROM app_role_permissions rp
    JOIN app_permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = $1
    ORDER BY rp.sort_order, p.permission_code
    `,
    [roleId],
  );
  return result.rows;
}

export async function listGuestOptions(): Promise<GuestOption[]> {
  const result = await query<GuestOption>(
    `
    SELECT id, first_name || ' ' || last_name AS full_name
    FROM guests
    ORDER BY first_name, last_name
    `,
  );
  return result.rows;
}

export async function listAvailableRoomsOptions(): Promise<
  Array<{ id: number; room_number: string; room_type: string; live_status: string }>
> {
  const result = await query<{ id: number; room_number: string; room_type: string; live_status: string }>(
    `
    SELECT id, room_number, room_type, live_status
    FROM room_live_status
    WHERE status = 'active'
    ORDER BY 
      CASE live_status 
        WHEN 'available' THEN 0 
        WHEN 'occupied' THEN 1 
        ELSE 2 
      END,
      room_number
    `,
  );
  return result.rows;
}

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const result = await query<{
    id: number;
    username: string;
    full_name: string;
    avatar_url: string | null;
    is_active: boolean;
    role_id: number | null;
    role_name: string | null;
  }>(
    `
    SELECT
      u.id,
      u.username,
      u.full_name,
      u.avatar_url,
      u.is_active,
      r.id AS role_id,
      r.role_name
    FROM app_users u
    LEFT JOIN app_user_roles ur ON ur.user_id = u.id
    LEFT JOIN app_roles r ON r.id = ur.role_id
    WHERE u.id = $1
    `,
    [userId],
  );

  if (!result.rowCount) return null;

  const first = result.rows[0];
  const roleNames: string[] = [];
  const roleIds: number[] = [];
  for (const r of result.rows) {
    if (r.role_name && !roleNames.includes(r.role_name)) roleNames.push(r.role_name);
    if (r.role_id != null && !roleIds.includes(r.role_id)) roleIds.push(r.role_id);
  }
  return {
    id: first.id,
    username: first.username,
    full_name: first.full_name,
    avatar_url: first.avatar_url,
    is_active: first.is_active,
    roles: roleNames,
    role_ids: roleIds,
  };
}

export async function listUsersWithRoles(): Promise<StaffUser[]> {
  const paged = await listUsersPaginated(1, 200);
  return paged.rows;
}

export async function listGuestsWithCurrentRoom(): Promise<GuestWithRoom[]> {
  const paged = await listGuestsPaginated(1, 200);
  return paged.rows;
}

export async function listRolesWithPermissions(): Promise<
  Array<{
    id: number;
    role_name: string;
    description: string | null;
    permissions: string[];
  }>
> {
  const result = await query<{
    role_id: number;
    role_name: string;
    description: string | null;
    permission_code: string | null;
  }>(
    `
    SELECT
      r.id AS role_id,
      r.role_name,
      r.description,
      p.permission_code
    FROM app_roles r
    LEFT JOIN app_role_permissions rp ON rp.role_id = r.id
    LEFT JOIN app_permissions p ON p.id = rp.permission_id
    ORDER BY r.role_name, rp.sort_order, p.permission_code
    `,
  );

  const byRole = new Map<
    number,
    { id: number; role_name: string; description: string | null; permissions: string[] }
  >();
  for (const row of result.rows) {
    const existing = byRole.get(row.role_id);
    if (existing) {
      if (row.permission_code) existing.permissions.push(row.permission_code);
      continue;
    }
    byRole.set(row.role_id, {
      id: row.role_id,
      role_name: row.role_name,
      description: row.description,
      permissions: row.permission_code ? [row.permission_code] : [],
    });
  }

  return [...byRole.values()];
}

/* ───── Service request types ──────────────────────────────────────── */

export type ServiceCategory = {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ServiceItem = {
  id: number;
  category_id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  estimated_cost: string | null;
  sort_order: number;
  is_active: boolean;
  estimated_duration_minutes: number | null;
};

export type ServiceRequestRow = {
  id: number;
  guest_name: string;
  room_number: string;
  item_name_en: string;
  item_name_ar: string;
  category_name_en: string;
  category_name_ar: string;
  category_slug: string;
  request_status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  quantity: number;
  estimated_cost: string | null;
  eta_minutes: number | null;
  eta_set_at: string | null;
  scheduled_at: string | null;
  assigned_to_name: string | null;
  assigned_to_avatar: string | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancelled_by_guest: boolean;
};

export type GuestAccessToken = {
  id: number;
  token: string;
  reservation_id: number;
  guest_name: string;
  room_number: string;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
};

export type GuestContext = {
  token: string;
  guestId: number;
  guestName: string;
  roomId: number;
  roomNumber: string;
  reservationId: number;
  checkIn: string;
  checkOut: string;
};

/* ───── Service categories & items queries ─────────────────────────── */

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  const result = await query<ServiceCategory>(
    `SELECT id, slug, name_en, name_ar, icon, sort_order, is_active
     FROM service_categories
     WHERE is_active = TRUE
     ORDER BY sort_order`,
  );
  return result.rows;
}

export async function listServiceItems(categoryId?: number): Promise<ServiceItem[]> {
  if (categoryId) {
    const result = await query<ServiceItem>(
      `SELECT id, category_id, slug, name_en, name_ar, description_en, description_ar,
              estimated_cost::text, sort_order, is_active, estimated_duration_minutes
       FROM service_items
       WHERE category_id = $1 AND is_active = TRUE
       ORDER BY sort_order`,
      [categoryId],
    );
    return result.rows;
  }

  const result = await query<ServiceItem>(
    `SELECT id, category_id, slug, name_en, name_ar, description_en, description_ar,
            estimated_cost::text, sort_order, is_active, estimated_duration_minutes
     FROM service_items
     WHERE is_active = TRUE
     ORDER BY sort_order`,
  );
  return result.rows;
}

export async function listServiceItemsByCategory(): Promise<
  Array<ServiceCategory & { items: ServiceItem[] }>
> {
  const [cats, items] = await Promise.all([
    listServiceCategories(),
    listServiceItems(),
  ]);

  return cats.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }));
}

/* ───── Service requests queries ──────────────────────────────────── */

export async function listServiceRequestsPaginated(
  page: number,
  pageSize: number,
  filters?: { status?: string; roomId?: number },
): Promise<Paginated<ServiceRequestRow>> {
  const pager = safeOffset(page, pageSize);

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters?.status) {
    conditions.push(`sr.request_status = $${idx++}`);
    values.push(filters.status);
  }
  if (filters?.roomId) {
    conditions.push(`sr.room_id = $${idx++}`);
    values.push(filters.roomId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM service_requests sr ${where}`,
    values,
  );
  const total = Number(countResult.rows[0]?.total ?? "0");

  const result = await query<ServiceRequestRow>(
    `SELECT
       sr.id,
       g.first_name || ' ' || g.last_name AS guest_name,
       rm.room_number,
       si.name_en AS item_name_en,
       si.name_ar AS item_name_ar,
       sc.name_en AS category_name_en,
       sc.name_ar AS category_name_ar,
       sc.slug AS category_slug,
       sr.request_status,
       sr.notes,
       sr.quantity,
       sr.estimated_cost::text,
       NULLIF(to_jsonb(sr)->>'eta_minutes', '')::int AS eta_minutes,
       to_jsonb(sr)->>'eta_set_at' AS eta_set_at,
       sr.scheduled_at::text,
       au.full_name AS assigned_to_name,
       au.avatar_url AS assigned_to_avatar,
       sr.created_at::text,
       sr.completed_at::text,
       sr.cancelled_at::text,
       sr.cancellation_reason,
       sr.cancelled_by_guest
     FROM service_requests sr
     JOIN guests g ON g.id = sr.guest_id
     JOIN rooms rm ON rm.id = sr.room_id
     JOIN service_items si ON si.id = sr.service_item_id
     JOIN service_categories sc ON sc.id = si.category_id
     LEFT JOIN app_users au ON au.id = sr.assigned_to
     ${where}
     ORDER BY
       CASE sr.request_status
         WHEN 'pending' THEN 1
         WHEN 'accepted' THEN 2
         WHEN 'in_progress' THEN 3
         WHEN 'completed' THEN 4
         WHEN 'cancelled' THEN 5
       END,
       sr.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, pager.pageSize, pager.offset],
  );

  return {
    rows: result.rows,
    pagination: { page: pager.page, pageSize: pager.pageSize, total },
  };
}

export async function listServiceRequestsByReservation(
  reservationId: number,
): Promise<(ServiceRequestRow & { estimated_duration_minutes: number | null })[]> {
  const result = await query<ServiceRequestRow & { estimated_duration_minutes: number | null }>(
    `SELECT
       sr.id,
       g.first_name || ' ' || g.last_name AS guest_name,
       rm.room_number,
       si.name_en AS item_name_en,
       si.name_ar AS item_name_ar,
       sc.name_en AS category_name_en,
       sc.name_ar AS category_name_ar,
       sc.slug AS category_slug,
       sr.request_status,
       sr.notes,
       sr.quantity,
       sr.estimated_cost::text,
      NULLIF(to_jsonb(sr)->>'eta_minutes', '')::int AS eta_minutes,
      to_jsonb(sr)->>'eta_set_at' AS eta_set_at,
       sr.scheduled_at::text,
       au.full_name AS assigned_to_name,
       au.avatar_url AS assigned_to_avatar,
       sr.created_at::text,
       sr.completed_at::text,
       sr.cancelled_at::text,
       sr.cancellation_reason,
       sr.cancelled_by_guest,
       si.estimated_duration_minutes,
       sr.service_item_id
     FROM service_requests sr
     JOIN guests g ON g.id = sr.guest_id
     JOIN rooms rm ON rm.id = sr.room_id
     JOIN service_items si ON si.id = sr.service_item_id
     JOIN service_categories sc ON sc.id = si.category_id
     LEFT JOIN app_users au ON au.id = sr.assigned_to
     WHERE sr.reservation_id = $1
     ORDER BY sr.created_at DESC`,
    [reservationId],
  );
  return result.rows;
}

/* ───── Guest access token queries ────────────────────────────────── */

export async function validateGuestToken(token: string): Promise<GuestContext | null> {
  const result = await query<{
    token: string;
    guest_id: number;
    guest_name: string;
    room_id: number;
    room_number: string;
    reservation_id: number;
    check_in: string;
    check_out: string;
  }>(
    `SELECT
       gat.token,
       g.id AS guest_id,
       g.first_name || ' ' || g.last_name AS guest_name,
       rm.id AS room_id,
       rm.room_number,
       re.id AS reservation_id,
       re.check_in::text,
       re.check_out::text
     FROM guest_access_tokens gat
     JOIN reservations re ON re.id = gat.reservation_id
     JOIN guests g ON g.id = re.guest_id
     JOIN rooms rm ON rm.id = re.room_id
     WHERE gat.token = $1
       AND gat.is_revoked = FALSE
       AND gat.expires_at > NOW()
       AND re.reservation_status IN ('booked', 'checked_in')`,
    [token],
  );

  if (!result.rowCount) {
    // Fallback: check room QR tokens
    return validateRoomQrToken(token);
  }

  const row = result.rows[0];
  return {
    token: row.token,
    guestId: row.guest_id,
    guestName: row.guest_name,
    roomId: row.room_id,
    roomNumber: row.room_number,
    reservationId: row.reservation_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
  };
}

export async function listStaffUsers(): Promise<Array<{ id: number; full_name: string }>> {
  const result = await query<{ id: number; full_name: string }>(
    `SELECT id, full_name FROM app_users WHERE is_active = TRUE ORDER BY full_name`,
  );
  return result.rows;
}

export async function getServiceRequestStats(): Promise<{
  pending: number;
  accepted: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total: number;
}> {
  const result = await query<{ status: string; cnt: string }>(
    `SELECT request_status AS status, COUNT(*)::text AS cnt
     FROM service_requests
     GROUP BY request_status`,
  );

  const stats = { pending: 0, accepted: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0 };
  for (const row of result.rows) {
    const v = Number(row.cnt);
    stats.total += v;
    if (row.status in stats) (stats as Record<string, number>)[row.status] = v;
  }
  return stats;
}

/* ───── Active reservations & service item options (for forms) ───── */

export type ActiveReservationOption = {
  id: number;
  guest_id: number;
  room_id: number;
  guest_name: string;
  room_number: string;
};

export async function listActiveReservations(): Promise<ActiveReservationOption[]> {
  const result = await query<ActiveReservationOption>(
    `SELECT
       re.id,
       re.guest_id,
       re.room_id,
       g.first_name || ' ' || g.last_name AS guest_name,
       rm.room_number
     FROM reservations re
     JOIN guests g ON g.id = re.guest_id
     JOIN rooms rm ON rm.id = re.room_id
     WHERE re.reservation_status IN ('booked', 'checked_in')
     ORDER BY re.created_at DESC`,
  );
  return result.rows;
}

export type ServiceItemOption = {
  id: number;
  name_en: string;
  name_ar: string;
  category_slug: string;
  category_name_en: string;
  category_name_ar: string;
  estimated_cost: string | null;
};

export async function listServiceItemOptions(): Promise<ServiceItemOption[]> {
  const result = await query<ServiceItemOption>(
    `SELECT
       si.id,
       si.name_en,
       si.name_ar,
       sc.slug AS category_slug,
       sc.name_en AS category_name_en,
       sc.name_ar AS category_name_ar,
       si.estimated_cost::text
     FROM service_items si
     JOIN service_categories sc ON sc.id = si.category_id
     WHERE si.is_active = TRUE AND sc.is_active = TRUE
     ORDER BY sc.sort_order, si.sort_order`,
  );
  return result.rows;
}

/* ───── Room QR token queries ─────────────────────────────────────── */

export type RoomQrToken = {
  id: number;
  room_id: number;
  room_number: string;
  floor: string;
  room_type: string;
  token: string | null;
  created_at: string | null;
  has_active_reservation: boolean;
  guest_name: string | null;
};

export async function listRoomQrTokens(): Promise<RoomQrToken[]> {
  const result = await query<RoomQrToken>(
    `SELECT
       r.id AS room_id,
       r.room_number,
       r.floor,
       r.room_type,
       rq.id,
       rq.token,
       rq.created_at::text,
       CASE WHEN re.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_active_reservation,
       CASE WHEN re.id IS NOT NULL THEN g.first_name || ' ' || g.last_name ELSE NULL END AS guest_name
     FROM rooms r
     LEFT JOIN room_qr_tokens rq ON rq.room_id = r.id
     LEFT JOIN LATERAL (
       SELECT re2.id, re2.guest_id
       FROM reservations re2
       WHERE re2.room_id = r.id AND re2.reservation_status IN ('booked', 'checked_in')
       ORDER BY re2.check_in DESC
       LIMIT 1
     ) re ON TRUE
     LEFT JOIN guests g ON g.id = re.guest_id
     WHERE r.status = 'active'
     ORDER BY r.room_number`,
  );
  return result.rows;
}

export async function generateRoomQrToken(roomId: number): Promise<string> {
  const crypto = await import("node:crypto");

  // Return existing token if one already exists (tokens are permanent)
  const existing = await query<{ token: string }>(
    `SELECT token FROM room_qr_tokens WHERE room_id = $1`,
    [roomId],
  );
  if (existing.rowCount) return existing.rows[0].token;

  const token = `room-${crypto.randomUUID()}-${crypto.randomBytes(12).toString("hex")}`;
  await query(
    `INSERT INTO room_qr_tokens (room_id, token) VALUES ($1, $2)
     ON CONFLICT (room_id) DO NOTHING`,
    [roomId, token],
  );

  return token;
}

export async function generateAllRoomQrTokens(): Promise<number> {
  const crypto = await import("node:crypto");
  const rooms = await query<{ id: number }>(`SELECT id FROM rooms WHERE status = 'active' ORDER BY id`);
  let count = 0;

  for (const room of rooms.rows) {
    const existing = await query(`SELECT id FROM room_qr_tokens WHERE room_id = $1`, [room.id]);
    if (existing.rowCount === 0) {
      const token = `room-${crypto.randomUUID()}-${crypto.randomBytes(12).toString("hex")}`;
      await query(`INSERT INTO room_qr_tokens (room_id, token) VALUES ($1, $2)`, [room.id, token]);
      count++;
    }
  }

  return count;
}

export async function validateRoomQrToken(token: string): Promise<GuestContext | null> {
  const result = await query<{
    token: string;
    guest_id: number;
    guest_name: string;
    room_id: number;
    room_number: string;
    reservation_id: number;
    check_in: string;
    check_out: string;
  }>(
    `SELECT
       rq.token,
       g.id AS guest_id,
       g.first_name || ' ' || g.last_name AS guest_name,
       rm.id AS room_id,
       rm.room_number,
       re.id AS reservation_id,
       re.check_in::text,
       re.check_out::text
     FROM room_qr_tokens rq
     JOIN rooms rm ON rm.id = rq.room_id
     JOIN LATERAL (
       SELECT re2.id, re2.guest_id, re2.check_in, re2.check_out
       FROM reservations re2
       WHERE re2.room_id = rq.room_id AND re2.reservation_status IN ('booked', 'checked_in')
       ORDER BY re2.check_in DESC
       LIMIT 1
     ) re ON TRUE
     JOIN guests g ON g.id = re.guest_id
     WHERE rq.token = $1`,
    [token],
  );

  if (!result.rowCount) return null;

  const row = result.rows[0];
  return {
    token: row.token,
    guestId: row.guest_id,
    guestName: row.guest_name,
    roomId: row.room_id,
    roomNumber: row.room_number,
    reservationId: row.reservation_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
  };
}

/* ───── Guest sessions (room QR token binding) ───────────────────── */

import { createSessionToken } from "@/lib/security";

/**
 * Check if a token is a room QR token (permanent, not per-reservation).
 */
export async function isRoomQrToken(token: string): Promise<boolean> {
  const result = await query(`SELECT 1 FROM room_qr_tokens WHERE token = $1`, [token]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Create a guest session binding a room QR token to a specific reservation.
 * Returns the session token string for use in a cookie.
 */
export async function createGuestSession(
  reservationId: number,
  roomQrToken: string,
  checkOut: string,
): Promise<string> {
  const sessionToken = createSessionToken();
  await query(
    `INSERT INTO guest_sessions (session_token, reservation_id, room_qr_token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [sessionToken, reservationId, roomQrToken, checkOut],
  );
  return sessionToken;
}

/**
 * Validate a guest session cookie. Returns GuestContext if the session
 * is still valid (reservation active), or null.
 */
export async function validateGuestSession(sessionToken: string): Promise<GuestContext | null> {
  const result = await query<{
    session_token: string;
    room_qr_token: string;
    guest_id: number;
    guest_name: string;
    room_id: number;
    room_number: string;
    reservation_id: number;
    check_in: string;
    check_out: string;
  }>(
    `SELECT
       gs.session_token,
       gs.room_qr_token,
       g.id AS guest_id,
       g.first_name || ' ' || g.last_name AS guest_name,
       rm.id AS room_id,
       rm.room_number,
       re.id AS reservation_id,
       re.check_in::text,
       re.check_out::text
     FROM guest_sessions gs
     JOIN reservations re ON re.id = gs.reservation_id
     JOIN guests g ON g.id = re.guest_id
     JOIN rooms rm ON rm.id = re.room_id
     WHERE gs.session_token = $1
       AND gs.expires_at > NOW()
       AND re.reservation_status IN ('booked', 'checked_in')`,
    [sessionToken],
  );

  if (!result.rowCount) return null;

  const row = result.rows[0];
  return {
    token: row.room_qr_token,
    guestId: row.guest_id,
    guestName: row.guest_name,
    roomId: row.room_id,
    roomNumber: row.room_number,
    reservationId: row.reservation_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
  };
}

/**
 * Revoke all guest sessions for a reservation (called on checkout/cancel).
 */
export async function revokeGuestSessionsByReservation(reservationId: number): Promise<void> {
  await query(
    `DELETE FROM guest_sessions WHERE reservation_id = $1`,
    [reservationId],
  );
}

/* ───── Admin: Service categories & items CRUD ─────────────────────── */

export async function listAllServiceCategories(): Promise<ServiceCategory[]> {
  const result = await query<ServiceCategory>(
    `SELECT id, slug, name_en, name_ar, icon, sort_order, is_active
     FROM service_categories
     ORDER BY sort_order`,
  );
  return result.rows;
}

export async function listAllServiceItems(): Promise<
  Array<ServiceItem & { category_name_en: string; category_name_ar: string }>
> {
  const result = await query<ServiceItem & { category_name_en: string; category_name_ar: string }>(
    `SELECT si.id, si.category_id, si.slug, si.name_en, si.name_ar,
            si.description_en, si.description_ar, si.estimated_cost::text,
            si.sort_order, si.is_active, si.estimated_duration_minutes,
            sc.name_en AS category_name_en, sc.name_ar AS category_name_ar
     FROM service_items si
     JOIN service_categories sc ON sc.id = si.category_id
     ORDER BY sc.sort_order, si.sort_order`,
  );
  return result.rows;
}

export async function getCategoryById(id: number): Promise<ServiceCategory | null> {
  const result = await query<ServiceCategory>(
    `SELECT id, slug, name_en, name_ar, icon, sort_order, is_active
     FROM service_categories WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getServiceItemById(id: number): Promise<ServiceItem | null> {
  const result = await query<ServiceItem>(
    `SELECT id, category_id, slug, name_en, name_ar, description_en, description_ar,
            estimated_cost::text, sort_order, is_active, estimated_duration_minutes
     FROM service_items WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

/* ───── Request tracking / logs ────────────────────────────────────── */

export type ServiceRequestLog = {
  id: number;
  service_request_id: number;
  old_status: string | null;
  new_status: string;
  changed_by_name: string | null;
  note: string | null;
  created_at: string;
};

export async function listRequestLogs(requestId: number): Promise<ServiceRequestLog[]> {
  const result = await query<ServiceRequestLog>(
    `SELECT srl.id, srl.service_request_id,
            srl.old_status, srl.new_status,
            au.full_name AS changed_by_name,
            srl.note,
            srl.created_at::text
     FROM service_request_logs srl
     LEFT JOIN app_users au ON au.id = srl.changed_by
     WHERE srl.service_request_id = $1
     ORDER BY srl.created_at ASC`,
    [requestId],
  );
  return result.rows;
}

export async function getAvgResponseTime(): Promise<string> {
  const result = await query<{ avg_minutes: string }>(
    `SELECT COALESCE(
       ROUND(AVG(EXTRACT(EPOCH FROM (
         COALESCE(sr.completed_at, NOW()) - sr.created_at
       )) / 60))::text, '0'
     ) AS avg_minutes
     FROM service_requests sr
     WHERE sr.request_status IN ('completed', 'in_progress')
       AND sr.created_at > NOW() - INTERVAL '7 days'`,
  );
  const mins = Number(result.rows[0]?.avg_minutes ?? "0");
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/* ───── Dashboard settings for widgets ─────────────────────────────── */

export type DashboardSetting = {
  id: number;
  setting_key: string;
  setting_value: unknown;
  updated_at: string;
};

export async function getDashboardSetting(key: string): Promise<unknown | null> {
  const result = await query<{ setting_value: unknown }>(
    `SELECT setting_value FROM dashboard_settings WHERE setting_key = $1`,
    [key],
  );
  return result.rows[0]?.setting_value ?? null;
}

export async function upsertDashboardSetting(key: string, value: unknown, userId: number): Promise<void> {
  await query(
    `INSERT INTO dashboard_settings (setting_key, setting_value, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2::jsonb, updated_by = $3, updated_at = NOW()`,
    [key, JSON.stringify(value), userId],
  );
}

/**
 * Resolve any token (guest_access_token OR room_qr_token) to guest info
 * including phone number, for phone-based verification.
 */
export async function getGuestInfoByToken(token: string): Promise<{
  phone: string | null;
  guestName: string;
  reservationId: number;
  checkOut: string;
} | null> {
  // Try guest_access_tokens first
  const gat = await query<{
    phone: string | null;
    guest_name: string;
    reservation_id: number;
    check_out: string;
  }>(
    `SELECT
       g.phone,
       g.first_name || ' ' || g.last_name AS guest_name,
       re.id AS reservation_id,
       re.check_out::text
     FROM guest_access_tokens gat
     JOIN reservations re ON re.id = gat.reservation_id
     JOIN guests g ON g.id = re.guest_id
     WHERE gat.token = $1
       AND gat.is_revoked = FALSE
       AND gat.expires_at > NOW()
       AND re.reservation_status IN ('booked', 'checked_in')`,
    [token],
  );

  if (gat.rowCount) {
    const row = gat.rows[0];
    return {
      phone: row.phone,
      guestName: row.guest_name,
      reservationId: row.reservation_id,
      checkOut: row.check_out,
    };
  }

  // Try room_qr_tokens
  const rqt = await query<{
    phone: string | null;
    guest_name: string;
    reservation_id: number;
    check_out: string;
  }>(
    `SELECT
       g.phone,
       g.first_name || ' ' || g.last_name AS guest_name,
       re.id AS reservation_id,
       re.check_out::text
     FROM room_qr_tokens rq
     JOIN rooms rm ON rm.id = rq.room_id
     JOIN LATERAL (
       SELECT re2.id, re2.guest_id, re2.check_out
       FROM reservations re2
       WHERE re2.room_id = rq.room_id AND re2.reservation_status IN ('booked', 'checked_in')
       ORDER BY re2.check_in DESC
       LIMIT 1
     ) re ON TRUE
     JOIN guests g ON g.id = re.guest_id
     WHERE rq.token = $1`,
    [token],
  );

  if (rqt.rowCount) {
    const row = rqt.rows[0];
    return {
      phone: row.phone,
      guestName: row.guest_name,
      reservationId: row.reservation_id,
      checkOut: row.check_out,
    };
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Guest Ratings
   ═══════════════════════════════════════════════════════════════════════════ */

export type Rating = {
  id: number;
  service_request_id: number;
  reservation_id: number;
  stars: number;
  emoji: string | null;
  comment: string | null;
  created_at: string;
};

export async function submitRating(
  serviceRequestId: number,
  reservationId: number,
  stars: number,
  emoji: string | null,
  comment: string | null,
): Promise<Rating> {
  const result = await query<Rating>(
    `INSERT INTO service_request_ratings (service_request_id, reservation_id, stars, emoji, comment)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (service_request_id) DO UPDATE
       SET stars = EXCLUDED.stars, emoji = EXCLUDED.emoji, comment = EXCLUDED.comment
     RETURNING *`,
    [serviceRequestId, reservationId, stars, emoji, comment],
  );
  return result.rows[0];
}

export async function getRatingByRequestId(requestId: number): Promise<Rating | null> {
  const result = await query<Rating>(
    `SELECT * FROM service_request_ratings WHERE service_request_id = $1`,
    [requestId],
  );
  return result.rows[0] ?? null;
}

export async function getRatingsForReservation(reservationId: number): Promise<Rating[]> {
  const result = await query<Rating>(
    `SELECT * FROM service_request_ratings WHERE reservation_id = $1 ORDER BY created_at DESC`,
    [reservationId],
  );
  return result.rows;
}

export type RatingStats = {
  total: number;
  average: number;
  distribution: Record<number, number>;
  emojiCounts: Record<string, number>;
};

export async function getRatingStats(): Promise<RatingStats> {
  const [avgResult, distResult, emojiResult] = await Promise.all([
    query<{ total: string; average: string }>(
      `SELECT COUNT(*)::text AS total, COALESCE(ROUND(AVG(stars)::numeric, 1), 0)::text AS average
       FROM service_request_ratings`,
    ),
    query<{ stars: number; count: string }>(
      `SELECT stars, COUNT(*)::text AS count FROM service_request_ratings GROUP BY stars ORDER BY stars`,
    ),
    query<{ emoji: string; count: string }>(
      `SELECT emoji, COUNT(*)::text AS count FROM service_request_ratings WHERE emoji IS NOT NULL GROUP BY emoji`,
    ),
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distResult.rows) distribution[row.stars] = Number(row.count);

  const emojiCounts: Record<string, number> = {};
  for (const row of emojiResult.rows) emojiCounts[row.emoji] = Number(row.count);

  return {
    total: Number(avgResult.rows[0]?.total ?? "0"),
    average: Number(avgResult.rows[0]?.average ?? "0"),
    distribution,
    emojiCounts,
  };
}

export type RecentReview = {
  stars: number;
  emoji: string | null;
  comment: string | null;
  guest_name: string;
  room_number: string;
  item_name_en: string;
  item_name_ar: string;
  created_at: string;
};

export async function getRecentReviews(limit = 10): Promise<RecentReview[]> {
  const result = await query<RecentReview>(
    `SELECT r.stars, r.emoji, r.comment,
            g.first_name || ' ' || g.last_name AS guest_name,
            rm.room_number,
            si.name_en AS item_name_en,
            si.name_ar AS item_name_ar,
            r.created_at::text
     FROM service_request_ratings r
     JOIN service_requests sr ON sr.id = r.service_request_id
     JOIN guests g ON g.id = sr.guest_id
     JOIN rooms rm ON rm.id = sr.room_id
     JOIN service_items si ON si.id = sr.service_item_id
     ORDER BY r.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

/* ═══════════════════════════════════════════════════════════════════════
   Housekeeping tasks
   ═══════════════════════════════════════════════════════════════════════ */

export type HousekeepingTask = {
  id: number;
  room_id: number;
  room_number: string;
  floor: number | null;
  task_type: string;
  task_status: string;
  priority: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  notes: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export async function listHousekeepingTasks(): Promise<HousekeepingTask[]> {
  const result = await query<HousekeepingTask>(
    `SELECT ht.id, ht.room_id, r.room_number, r.floor,
            ht.task_type, ht.task_status, ht.priority,
            ht.assigned_to, au.full_name AS assigned_to_name,
            ht.notes,
            ht.created_at::text, ht.started_at::text, ht.completed_at::text
     FROM housekeeping_tasks ht
     JOIN rooms r ON r.id = ht.room_id
     LEFT JOIN app_users au ON au.id = ht.assigned_to
     ORDER BY
       CASE ht.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
       ht.created_at DESC`,
  );
  return result.rows;
}

export async function createHousekeepingTask(
  roomId: number,
  taskType: string,
  priority: string,
  assignedTo: number | null,
  notes: string | null,
): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO housekeeping_tasks (room_id, task_type, priority, assigned_to, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [roomId, taskType, priority, assignedTo, notes],
  );
  return result.rows[0].id;
}

export async function updateHousekeepingTaskStatus(
  taskId: number,
  status: string,
): Promise<void> {
  const extras =
    status === "in_progress"
      ? ", started_at = NOW()"
      : status === "done" || status === "verified"
        ? ", completed_at = NOW()"
        : "";
  await query(
    `UPDATE housekeeping_tasks SET task_status = $1${extras} WHERE id = $2`,
    [status, taskId],
  );
}

export async function deleteHousekeepingTask(taskId: number): Promise<void> {
  await query(`DELETE FROM housekeeping_tasks WHERE id = $1`, [taskId]);
}

/* ═══════════════════════════════════════════════════════════════════════
   Analytics queries
   ═══════════════════════════════════════════════════════════════════════ */

export type OccupancyPoint = { date: string; occupied: number; total: number };

export async function getOccupancyTrend(days = 14): Promise<OccupancyPoint[]> {
  const result = await query<OccupancyPoint>(
    `WITH dates AS (
       SELECT generate_series(
         CURRENT_DATE - ($1 - 1) * INTERVAL '1 day',
         CURRENT_DATE,
         '1 day'
       )::date AS d
     ),
     total AS (SELECT COUNT(*)::int AS cnt FROM rooms WHERE status = 'active')
     SELECT
       d::text AS date,
       COALESCE(COUNT(res.id), 0)::int AS occupied,
       total.cnt AS total
     FROM dates
     CROSS JOIN total
     LEFT JOIN reservations res
       ON res.room_id IS NOT NULL
       AND res.reservation_status IN ('booked','checked_in')
       AND d >= res.check_in::date AND d < res.check_out::date
     GROUP BY d, total.cnt
     ORDER BY d`,
    [days],
  );
  return result.rows;
}

export type CategoryRevenue = {
  category_en: string;
  category_ar: string;
  total_requests: number;
  total_revenue: number;
};

export async function getRevenueByCategory(): Promise<CategoryRevenue[]> {
  const result = await query<CategoryRevenue>(
    `SELECT
       sc.name_en AS category_en,
       sc.name_ar AS category_ar,
       COUNT(sr.id)::int AS total_requests,
       COALESCE(SUM(sr.estimated_cost), 0)::float AS total_revenue
     FROM service_requests sr
     JOIN service_items si ON si.id = sr.service_item_id
     JOIN service_categories sc ON sc.id = si.category_id
     WHERE sr.request_status != 'cancelled'
     GROUP BY sc.name_en, sc.name_ar
     ORDER BY total_revenue DESC`,
  );
  return result.rows;
}

export type PopularItem = {
  item_en: string;
  item_ar: string;
  category_en: string;
  category_ar: string;
  order_count: number;
};

export async function getPopularItems(limit = 10): Promise<PopularItem[]> {
  const result = await query<PopularItem>(
    `SELECT
       si.name_en AS item_en, si.name_ar AS item_ar,
       sc.name_en AS category_en, sc.name_ar AS category_ar,
       COUNT(sr.id)::int AS order_count
     FROM service_requests sr
     JOIN service_items si ON si.id = sr.service_item_id
     JOIN service_categories sc ON sc.id = si.category_id
     WHERE sr.request_status != 'cancelled'
     GROUP BY si.name_en, si.name_ar, sc.name_en, sc.name_ar
     ORDER BY order_count DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export type HourlyDistribution = { hour: number; count: number };

export async function getRequestsByHour(): Promise<HourlyDistribution[]> {
  const result = await query<HourlyDistribution>(
    `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS count
     FROM service_requests
     GROUP BY hour
     ORDER BY hour`,
  );
  const map = new Map(result.rows.map((r) => [r.hour, r.count]));
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: map.get(i) ?? 0,
  }));
}

export type StaffPerformance = {
  staff_name: string;
  completed_count: number;
  avg_minutes: number;
};

export async function getStaffPerformance(): Promise<StaffPerformance[]> {
  const result = await query<StaffPerformance>(
    `SELECT
       au.full_name AS staff_name,
       COUNT(sr.id)::int AS completed_count,
       COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (sr.completed_at - sr.created_at)) / 60)::numeric, 0), 0)::int AS avg_minutes
     FROM service_requests sr
     JOIN app_users au ON au.id = sr.assigned_to
     WHERE sr.request_status = 'completed' AND sr.assigned_to IS NOT NULL
     GROUP BY au.full_name
     ORDER BY completed_count DESC`,
  );
  return result.rows;
}

export type SatisfactionTrend = { date: string; avg_stars: number; count: number };

export async function getSatisfactionTrend(days = 14): Promise<SatisfactionTrend[]> {
  const result = await query<SatisfactionTrend>(
    `WITH dates AS (
       SELECT generate_series(
         CURRENT_DATE - ($1 - 1) * INTERVAL '1 day',
         CURRENT_DATE,
         '1 day'
       )::date AS d
     )
     SELECT
       d::text AS date,
       COALESCE(ROUND(AVG(r.stars)::numeric, 1), 0)::float AS avg_stars,
       COUNT(r.id)::int AS count
     FROM dates
     LEFT JOIN service_request_ratings r ON r.created_at::date = d
     GROUP BY d
     ORDER BY d`,
    [days],
  );
  return result.rows;
}

/* ═══════════════════════════════════════════════════════════════════════
   Activity feed
   ═══════════════════════════════════════════════════════════════════════ */

export type ActivityEvent = {
  id: string;
  event_type: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  room_number: string | null;
  created_at: string;
};

export async function getRecentActivity(limit = 50): Promise<ActivityEvent[]> {
  const result = await query<ActivityEvent>(
    `(
       SELECT
         'sr-' || sr.id AS id,
         CASE sr.request_status
           WHEN 'pending' THEN 'new_request'
           WHEN 'completed' THEN 'completed'
           WHEN 'cancelled' THEN 'cancelled'
           ELSE 'updated'
         END AS event_type,
         si.name_en AS title_en,
         si.name_ar AS title_ar,
         g.first_name || ' ' || g.last_name || ' — ' || sr.request_status AS subtitle_en,
         g.first_name || ' ' || g.last_name || ' — ' || sr.request_status AS subtitle_ar,
         rm.room_number,
         sr.created_at::text
       FROM service_requests sr
       JOIN guests g ON g.id = sr.guest_id
       JOIN rooms rm ON rm.id = sr.room_id
       JOIN service_items si ON si.id = sr.service_item_id
       ORDER BY sr.created_at DESC
       LIMIT $1
     )
     UNION ALL
     (
       SELECT
         'res-' || res.id AS id,
         CASE res.reservation_status
           WHEN 'checked_in' THEN 'check_in'
           WHEN 'checked_out' THEN 'check_out'
           WHEN 'booked' THEN 'booking'
           ELSE 'reservation'
         END AS event_type,
         g.first_name || ' ' || g.last_name AS title_en,
         g.first_name || ' ' || g.last_name AS title_ar,
         res.reservation_status || ' — Room ' || rm.room_number AS subtitle_en,
         res.reservation_status || ' — غرفة ' || rm.room_number AS subtitle_ar,
         rm.room_number,
         res.created_at::text
       FROM reservations res
       JOIN guests g ON g.id = res.guest_id
       JOIN rooms rm ON rm.id = res.room_id
       ORDER BY res.created_at DESC
       LIMIT $1
     )
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

/* ═══════════════════════════════════════════════════════════════════════
   Cart
   ═══════════════════════════════════════════════════════════════════════ */

export type CartItem = {
  id: number;
  reservation_id: number;
  service_item_id: number;
  item_name_en: string;
  item_name_ar: string;
  category_name_en: string;
  category_name_ar: string;
  estimated_cost: string | null;
  quantity: number;
  notes: string | null;
  scheduled_at: string | null;
  created_at: string;
};

export async function listCartItems(reservationId: number): Promise<CartItem[]> {
  const result = await query<CartItem>(
    `SELECT ci.id, ci.reservation_id, ci.service_item_id,
            si.name_en AS item_name_en, si.name_ar AS item_name_ar,
            sc.name_en AS category_name_en, sc.name_ar AS category_name_ar,
            si.estimated_cost::text,
            ci.quantity, ci.notes, ci.scheduled_at::text, ci.created_at::text
     FROM cart_items ci
     JOIN service_items si ON si.id = ci.service_item_id
     JOIN service_categories sc ON sc.id = si.category_id
     WHERE ci.reservation_id = $1
     ORDER BY ci.created_at DESC`,
    [reservationId],
  );
  return result.rows;
}

export async function addCartItem(
  reservationId: number, serviceItemId: number, quantity: number,
  notes: string | null, scheduledAt: string | null, guestId: number,
): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO cart_items (reservation_id, service_item_id, quantity, notes, scheduled_at, added_by_guest)
     VALUES ($1,$2,$3,$4,$5::timestamptz,$6) RETURNING id`,
    [reservationId, serviceItemId, quantity, notes, scheduledAt, guestId],
  );
  return result.rows[0].id;
}

export async function removeCartItem(id: number, reservationId: number): Promise<void> {
  await query(`DELETE FROM cart_items WHERE id=$1 AND reservation_id=$2`, [id, reservationId]);
}

export async function clearCart(reservationId: number): Promise<void> {
  await query(`DELETE FROM cart_items WHERE reservation_id=$1`, [reservationId]);
}

export async function checkoutCart(reservationId: number, guestId: number, roomId: number): Promise<number[]> {
  const items = await query<{ service_item_id: number; quantity: number; notes: string | null; scheduled_at: string | null }>(
    `SELECT service_item_id, quantity, notes, scheduled_at::text FROM cart_items WHERE reservation_id=$1`,
    [reservationId],
  );
  const ids: number[] = [];
  for (const item of items.rows) {
    const r = await query<{ id: number }>(
      `INSERT INTO service_requests (guest_id, room_id, reservation_id, service_item_id, quantity, notes, scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz) RETURNING id`,
      [guestId, roomId, reservationId, item.service_item_id, item.quantity, item.notes, item.scheduled_at],
    );
    ids.push(r.rows[0].id);
    // Update favorites
    await query(
      `INSERT INTO guest_favorites (guest_id, service_item_id, order_count, last_ordered_at)
       VALUES ($1,$2,1,NOW())
       ON CONFLICT (guest_id, service_item_id) DO UPDATE SET order_count = guest_favorites.order_count+1, last_ordered_at=NOW()`,
      [guestId, item.service_item_id],
    );
  }
  await clearCart(reservationId);
  return ids;
}

/* ═══════════════════════════════════════════════════════════════════════
   Chat messages
   ═══════════════════════════════════════════════════════════════════════ */

export type ChatMessage = {
  id: number;
  reservation_id: number;
  sender_type: "guest" | "staff";
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export async function listChatMessages(reservationId: number, limit = 100): Promise<ChatMessage[]> {
  const result = await query<ChatMessage>(
    `SELECT cm.id, cm.reservation_id, cm.sender_type,
            CASE WHEN cm.sender_type='guest' THEN g.first_name||' '||g.last_name
                 ELSE COALESCE(au.full_name,'Staff') END AS sender_name,
            cm.message, cm.is_read, cm.created_at::text
     FROM chat_messages cm
     LEFT JOIN guests g ON g.id = cm.sender_guest_id
     LEFT JOIN app_users au ON au.id = cm.sender_staff_id
     WHERE cm.reservation_id=$1
     ORDER BY cm.created_at ASC
     LIMIT $2`,
    [reservationId, limit],
  );
  return result.rows;
}

export async function createChatMessage(
  reservationId: number, senderType: "guest" | "staff",
  senderId: number, message: string,
): Promise<ChatMessage> {
  const col = senderType === "guest" ? "sender_guest_id" : "sender_staff_id";
  const result = await query<{ id: number; created_at: string }>(
    `INSERT INTO chat_messages (reservation_id, sender_type, ${col}, message)
     VALUES ($1,$2,$3,$4) RETURNING id, created_at::text`,
    [reservationId, senderType, senderId, message],
  );
  return { ...result.rows[0], reservation_id: reservationId, sender_type: senderType, sender_name: "", message, is_read: false };
}

export async function markChatRead(reservationId: number, readerType: "guest" | "staff"): Promise<void> {
  const oppositeType = readerType === "guest" ? "staff" : "guest";
  await query(
    `UPDATE chat_messages SET is_read=TRUE WHERE reservation_id=$1 AND sender_type=$2 AND NOT is_read`,
    [reservationId, oppositeType],
  );
}

export type ChatSummary = {
  reservation_id: number;
  room_number: string;
  guest_name: string;
  last_message: string;
  last_at: string;
  unread_count: number;
};

export async function listActiveChats(): Promise<ChatSummary[]> {
  const result = await query<ChatSummary>(
    `SELECT DISTINCT ON (cm.reservation_id)
            cm.reservation_id,
            rm.room_number,
            g.first_name||' '||g.last_name AS guest_name,
            cm.message AS last_message,
            cm.created_at::text AS last_at,
            (SELECT COUNT(*)::int FROM chat_messages c2
             WHERE c2.reservation_id=cm.reservation_id AND c2.sender_type='guest' AND NOT c2.is_read
            ) AS unread_count
     FROM chat_messages cm
     JOIN reservations res ON res.id = cm.reservation_id
     JOIN guests g ON g.id = res.guest_id
     JOIN rooms rm ON rm.id = res.room_id
     ORDER BY cm.reservation_id, cm.created_at DESC`,
  );
  return result.rows;
}

/* ═══════════════════════════════════════════════════════════════════════
   Invoices
   ═══════════════════════════════════════════════════════════════════════ */

export type Invoice = {
  id: number;
  reservation_id: number;
  guest_name: string;
  room_number: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  currency: string;
  status: string;
  created_at: string;
  closed_at: string | null;
};

export type InvoiceItem = {
  id: number;
  description_en: string;
  description_ar: string;
  quantity: number;
  unit_price: string;
  total: string;
  created_at: string;
};

export async function getOrCreateInvoice(reservationId: number, guestId: number, roomId: number): Promise<Invoice> {
  // Try to get existing
  let result = await query<Invoice>(
    `SELECT inv.id, inv.reservation_id,
            g.first_name||' '||g.last_name AS guest_name,
            rm.room_number,
            inv.subtotal::text, inv.tax_rate::text, inv.tax_amount::text, inv.total::text,
            inv.currency, inv.status, inv.created_at::text, inv.closed_at::text
     FROM invoices inv
     JOIN guests g ON g.id = inv.guest_id
     JOIN rooms rm ON rm.id = inv.room_id
     WHERE inv.reservation_id=$1`,
    [reservationId],
  );
  if (result.rows[0]) return result.rows[0];
  // Create new
  await query(
    `INSERT INTO invoices (reservation_id, guest_id, room_id) VALUES ($1,$2,$3)`,
    [reservationId, guestId, roomId],
  );
  result = await query<Invoice>(
    `SELECT inv.id, inv.reservation_id,
            g.first_name||' '||g.last_name AS guest_name,
            rm.room_number,
            inv.subtotal::text, inv.tax_rate::text, inv.tax_amount::text, inv.total::text,
            inv.currency, inv.status, inv.created_at::text, inv.closed_at::text
     FROM invoices inv
     JOIN guests g ON g.id = inv.guest_id
     JOIN rooms rm ON rm.id = inv.room_id
     WHERE inv.reservation_id=$1`,
    [reservationId],
  );
  return result.rows[0];
}

export async function syncInvoiceItems(reservationId: number): Promise<void> {
  const inv = await query<{ id: number }>(`SELECT id FROM invoices WHERE reservation_id=$1`, [reservationId]);
  if (!inv.rows[0]) return;
  const invoiceId = inv.rows[0].id;

  // Add items for completed requests not yet invoiced
  await query(
    `INSERT INTO invoice_items (invoice_id, service_request_id, description_en, description_ar, quantity, unit_price, total)
     SELECT $1, sr.id, si.name_en, si.name_ar, sr.quantity,
            COALESCE(si.estimated_cost, 0),
            sr.quantity * COALESCE(si.estimated_cost, 0)
     FROM service_requests sr
     JOIN service_items si ON si.id = sr.service_item_id
     WHERE sr.reservation_id = $2 AND sr.request_status = 'completed'
       AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.service_request_id = sr.id)`,
    [invoiceId, reservationId],
  );

  // Recalculate totals
  await query(
    `UPDATE invoices SET
       subtotal = COALESCE((SELECT SUM(total) FROM invoice_items WHERE invoice_id=$1), 0),
       tax_amount = COALESCE((SELECT SUM(total) FROM invoice_items WHERE invoice_id=$1), 0) * tax_rate,
       total = COALESCE((SELECT SUM(total) FROM invoice_items WHERE invoice_id=$1), 0) * (1 + tax_rate)
     WHERE id=$1`,
    [invoiceId],
  );
}

export async function listInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
  const result = await query<InvoiceItem>(
    `SELECT id, description_en, description_ar, quantity, unit_price::text, total::text, created_at::text
     FROM invoice_items WHERE invoice_id=$1 ORDER BY created_at`,
    [invoiceId],
  );
  return result.rows;
}

export async function listAllInvoices(): Promise<Invoice[]> {
  const result = await query<Invoice>(
    `SELECT inv.id, inv.reservation_id,
            g.first_name||' '||g.last_name AS guest_name,
            rm.room_number,
            inv.subtotal::text, inv.tax_rate::text, inv.tax_amount::text, inv.total::text,
            inv.currency, inv.status, inv.created_at::text, inv.closed_at::text
     FROM invoices inv
     JOIN guests g ON g.id = inv.guest_id
     JOIN rooms rm ON rm.id = inv.room_id
     ORDER BY inv.created_at DESC`,
  );
  return result.rows;
}

export async function updateInvoiceStatus(invoiceId: number, status: string): Promise<void> {
  const extra = status === "closed" || status === "paid" ? ", closed_at=NOW()" : "";
  await query(`UPDATE invoices SET status=$1${extra} WHERE id=$2`, [status, invoiceId]);
}

/* ═══════════════════════════════════════════════════════════════════════
   DND & Wake-up
   ═══════════════════════════════════════════════════════════════════════ */

export async function setDnd(reservationId: number, active: boolean): Promise<void> {
  await query(`UPDATE reservations SET dnd_active=$1 WHERE id=$2`, [active, reservationId]);
}

export async function getDnd(reservationId: number): Promise<boolean> {
  const r = await query<{ dnd_active: boolean }>(`SELECT dnd_active FROM reservations WHERE id=$1`, [reservationId]);
  return r.rows[0]?.dnd_active ?? false;
}

export type WakeUpCall = {
  id: number;
  wake_time: string;
  wake_date: string;
  status: string;
  created_at: string;
};

export async function createWakeUpCall(reservationId: number, roomId: number, wakeTime: string, wakeDate: string): Promise<number> {
  // Cancel any existing active calls for this reservation
  await query(`UPDATE wake_up_calls SET status='cancelled' WHERE reservation_id=$1 AND status='active'`, [reservationId]);
  const r = await query<{ id: number }>(
    `INSERT INTO wake_up_calls (reservation_id, room_id, wake_time, wake_date) VALUES ($1,$2,$3,$4) RETURNING id`,
    [reservationId, roomId, wakeTime, wakeDate],
  );
  return r.rows[0].id;
}

export async function getActiveWakeUp(reservationId: number): Promise<WakeUpCall | null> {
  const r = await query<WakeUpCall>(
    `SELECT id, wake_time::text, wake_date::text, status, created_at::text
     FROM wake_up_calls WHERE reservation_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 1`,
    [reservationId],
  );
  return r.rows[0] ?? null;
}

export async function cancelWakeUp(id: number): Promise<void> {
  await query(`UPDATE wake_up_calls SET status='cancelled' WHERE id=$1`, [id]);
}

/* ── Admin: list all active DND rooms ── */
export type DndRoom = {
  reservation_id: number;
  room_number: string;
  guest_name: string;
};

export async function listActiveDndRooms(): Promise<DndRoom[]> {
  const r = await query<DndRoom>(
    `SELECT r.id AS reservation_id, rm.room_number, g.first_name || ' ' || g.last_name AS guest_name
     FROM reservations r
     JOIN rooms rm ON rm.id = r.room_id
     JOIN guests g ON g.id = r.guest_id
     WHERE r.dnd_active = TRUE AND r.reservation_status = 'checked_in'
     ORDER BY rm.room_number`,
    [],
  );
  return r.rows;
}

/* ── Admin: list all active wake-up calls ── */
export type AdminWakeUp = {
  id: number;
  room_number: string;
  guest_name: string;
  wake_time: string;
  wake_date: string;
  created_at: string;
};

export async function listActiveWakeUpCalls(): Promise<AdminWakeUp[]> {
  const r = await query<AdminWakeUp>(
    `SELECT w.id, rm.room_number, g.first_name || ' ' || g.last_name AS guest_name,
            w.wake_time::text, w.wake_date::text, w.created_at::text
     FROM wake_up_calls w
     JOIN reservations res ON res.id = w.reservation_id
     JOIN rooms rm ON rm.id = w.room_id
     JOIN guests g ON g.id = res.guest_id
     WHERE w.status = 'active'
     ORDER BY w.wake_date, w.wake_time`,
    [],
  );
  return r.rows;
}

/* ═══════════════════════════════════════════════════════════════════════
   Favorites
   ═══════════════════════════════════════════════════════════════════════ */

export type FavoriteItem = {
  id: number;
  service_item_id: number;
  item_name_en: string;
  item_name_ar: string;
  category_name_en: string;
  category_name_ar: string;
  estimated_cost: string | null;
  order_count: number;
};

export async function listFavorites(guestId: number): Promise<FavoriteItem[]> {
  const r = await query<FavoriteItem>(
    `SELECT gf.id, gf.service_item_id,
            si.name_en AS item_name_en, si.name_ar AS item_name_ar,
            sc.name_en AS category_name_en, sc.name_ar AS category_name_ar,
            si.estimated_cost::text, gf.order_count
     FROM guest_favorites gf
     JOIN service_items si ON si.id = gf.service_item_id
     JOIN service_categories sc ON sc.id = si.category_id
     WHERE gf.guest_id=$1
     ORDER BY gf.order_count DESC
     LIMIT 10`,
    [guestId],
  );
  return r.rows;
}

/* ═══════════════════════════════════════════════════════════════════════
   Lost & Found
   ═══════════════════════════════════════════════════════════════════════ */

export type LostFoundItem = {
  id: number;
  room_number: string | null;
  item_description: string;
  location_found: string | null;
  category: string;
  status: string;
  contact_info: string | null;
  notes: string | null;
  reporter_name: string | null;
  created_at: string;
  resolved_at: string | null;
};

export async function listLostFoundItems(statusFilter?: string): Promise<LostFoundItem[]> {
  const where = statusFilter ? `WHERE lf.status=$1` : "";
  const params = statusFilter ? [statusFilter] : [];
  const r = await query<LostFoundItem>(
    `SELECT lf.id, rm.room_number, lf.item_description, lf.location_found,
            lf.category, lf.status, lf.contact_info, lf.notes,
            COALESCE(g.first_name||' '||g.last_name, au.full_name) AS reporter_name,
            lf.created_at::text, lf.resolved_at::text
     FROM lost_found_items lf
     LEFT JOIN rooms rm ON rm.id = lf.room_id
     LEFT JOIN guests g ON g.id = lf.reported_by_guest
     LEFT JOIN app_users au ON au.id = lf.reported_by_staff
     ${where}
     ORDER BY lf.created_at DESC`,
    params,
  );
  return r.rows;
}

export async function createLostFoundItem(
  roomId: number | null, reportedByStaff: number | null, reportedByGuest: number | null,
  itemDescription: string, locationFound: string | null, category: string,
  contactInfo: string | null, notes: string | null,
): Promise<number> {
  const r = await query<{ id: number }>(
    `INSERT INTO lost_found_items (room_id, reported_by_staff, reported_by_guest, item_description, location_found, category, contact_info, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [roomId, reportedByStaff, reportedByGuest, itemDescription, locationFound, category, contactInfo, notes],
  );
  return r.rows[0].id;
}

export async function updateLostFoundStatus(id: number, status: string): Promise<void> {
  const extra = status === "claimed" || status === "disposed" ? ", resolved_at=NOW()" : "";
  await query(`UPDATE lost_found_items SET status=$1${extra} WHERE id=$2`, [status, id]);
}

/* ═══════════════════════════════════════════════════════════════════════
   Complaints
   ═══════════════════════════════════════════════════════════════════════ */

export type Complaint = {
  id: number;
  reservation_id: number | null;
  guest_name: string;
  room_number: string | null;
  category: string;
  subject: string;
  description: string;
  severity: string;
  status: string;
  assigned_to_name: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
};

export async function listComplaints(statusFilter?: string): Promise<Complaint[]> {
  const where = statusFilter ? `WHERE c.status=$1` : "";
  const params = statusFilter ? [statusFilter] : [];
  const r = await query<Complaint>(
    `SELECT c.id, c.reservation_id,
            g.first_name||' '||g.last_name AS guest_name,
            rm.room_number, c.category, c.subject, c.description,
            c.severity, c.status, au.full_name AS assigned_to_name,
            c.resolution, c.created_at::text, c.resolved_at::text
     FROM complaints c
     JOIN guests g ON g.id = c.guest_id
     LEFT JOIN rooms rm ON rm.id = c.room_id
     LEFT JOIN app_users au ON au.id = c.assigned_to
     ${where}
     ORDER BY
       CASE c.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       c.created_at DESC`,
    params,
  );
  return r.rows;
}

export async function createComplaint(
  reservationId: number | null, guestId: number, roomId: number | null,
  category: string, subject: string, description: string, severity: string,
): Promise<number> {
  const r = await query<{ id: number }>(
    `INSERT INTO complaints (reservation_id, guest_id, room_id, category, subject, description, severity)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [reservationId, guestId, roomId, category, subject, description, severity],
  );
  return r.rows[0].id;
}

export async function updateComplaintStatus(id: number, status: string, resolution?: string): Promise<void> {
  if (resolution !== undefined) {
    await query(
      `UPDATE complaints SET status=$1, resolution=$2, resolved_at=CASE WHEN $1 IN ('resolved','closed') THEN NOW() ELSE NULL END WHERE id=$3`,
      [status, resolution, id],
    );
  } else {
    await query(`UPDATE complaints SET status=$1 WHERE id=$2`, [status, id]);
  }
}

export async function assignComplaint(id: number, staffId: number): Promise<void> {
  await query(`UPDATE complaints SET assigned_to=$1, status='investigating' WHERE id=$2`, [staffId, id]);
}

/* ═══════════════════════════════════════════════════════════════════════
   Facility bookings
   ═══════════════════════════════════════════════════════════════════════ */

export type FacilityType = {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  capacity: number;
  slot_duration_minutes: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
};

export async function listFacilityTypes(): Promise<FacilityType[]> {
  const r = await query<FacilityType>(
    `SELECT id, slug, name_en, name_ar, capacity, slot_duration_minutes,
            open_time::text, close_time::text, is_active
     FROM facility_types WHERE is_active ORDER BY name_en`,
  );
  return r.rows;
}

export type TimeSlot = { start: string; end: string; available: number };

export async function getAvailableSlots(facilityId: number, date: string): Promise<TimeSlot[]> {
  const fac = await query<FacilityType>(
    `SELECT * , open_time::text, close_time::text FROM facility_types WHERE id=$1`, [facilityId],
  );
  if (!fac.rows[0]) return [];
  const f = fac.rows[0];

  // Get existing bookings for this date
  const bookings = await query<{ start_time: string; guests_count: number }>(
    `SELECT start_time::text, guests_count FROM facility_bookings
     WHERE facility_id=$1 AND booking_date=$2 AND status='confirmed'`,
    [facilityId, date],
  );
  const bookedMap = new Map<string, number>();
  for (const b of bookings.rows) {
    bookedMap.set(b.start_time, (bookedMap.get(b.start_time) ?? 0) + b.guests_count);
  }

  // Generate slots
  const slots: TimeSlot[] = [];
  const [oh, om] = f.open_time.split(":").map(Number);
  const [ch, cm] = f.close_time.split(":").map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;

  for (let m = openMin; m + f.slot_duration_minutes <= closeMin; m += f.slot_duration_minutes) {
    const startH = Math.floor(m / 60).toString().padStart(2, "0");
    const startM = (m % 60).toString().padStart(2, "0");
    const endM2 = m + f.slot_duration_minutes;
    const endH = Math.floor(endM2 / 60).toString().padStart(2, "0");
    const endMn = (endM2 % 60).toString().padStart(2, "0");
    const start = `${startH}:${startM}:00`;
    const end = `${endH}:${endMn}:00`;
    const booked = bookedMap.get(start) ?? 0;
    slots.push({ start, end, available: Math.max(0, f.capacity - booked) });
  }
  return slots;
}

export type FacilityBooking = {
  id: number;
  facility_name_en: string;
  facility_name_ar: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  status: string;
  guest_name: string;
  room_number: string;
  created_at: string;
};

export async function createFacilityBooking(
  facilityId: number, reservationId: number, guestId: number,
  bookingDate: string, startTime: string, endTime: string, guestsCount: number, notes: string | null,
): Promise<number> {
  const r = await query<{ id: number }>(
    `INSERT INTO facility_bookings (facility_id, reservation_id, guest_id, booking_date, start_time, end_time, guests_count, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [facilityId, reservationId, guestId, bookingDate, startTime, endTime, guestsCount, notes],
  );
  return r.rows[0].id;
}

export async function cancelFacilityBooking(id: number): Promise<void> {
  await query(`UPDATE facility_bookings SET status='cancelled' WHERE id=$1`, [id]);
}

export async function listFacilityBookings(facilityId?: number, date?: string): Promise<FacilityBooking[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (facilityId) { conditions.push(`fb.facility_id=$${idx++}`); params.push(facilityId); }
  if (date) { conditions.push(`fb.booking_date=$${idx++}`); params.push(date); }
  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const r = await query<FacilityBooking>(
    `SELECT fb.id, ft.name_en AS facility_name_en, ft.name_ar AS facility_name_ar,
            fb.booking_date::text, fb.start_time::text, fb.end_time::text,
            fb.guests_count, fb.status,
            g.first_name||' '||g.last_name AS guest_name,
            rm.room_number, fb.created_at::text
     FROM facility_bookings fb
     JOIN facility_types ft ON ft.id = fb.facility_id
     JOIN reservations res ON res.id = fb.reservation_id
     JOIN guests g ON g.id = fb.guest_id
     JOIN rooms rm ON rm.id = res.room_id
     ${where}
     ORDER BY fb.booking_date, fb.start_time`,
    params,
  );
  return r.rows;
}

export async function getGuestFacilityBookings(reservationId: number): Promise<FacilityBooking[]> {
  const r = await query<FacilityBooking>(
    `SELECT fb.id, ft.name_en AS facility_name_en, ft.name_ar AS facility_name_ar,
            fb.booking_date::text, fb.start_time::text, fb.end_time::text,
            fb.guests_count, fb.status,
            g.first_name||' '||g.last_name AS guest_name,
            rm.room_number, fb.created_at::text
     FROM facility_bookings fb
     JOIN facility_types ft ON ft.id = fb.facility_id
     JOIN reservations res ON res.id = fb.reservation_id
     JOIN guests g ON g.id = fb.guest_id
     JOIN rooms rm ON rm.id = res.room_id
     WHERE fb.reservation_id=$1 AND fb.status='confirmed'
     ORDER BY fb.booking_date, fb.start_time`,
    [reservationId],
  );
  return r.rows;
}

/* ═══════════════════════════════════════════════════════════════════════
   API Keys
   ═══════════════════════════════════════════════════════════════════════ */

export type ApiKeyRow = {
  id: number;
  label: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  request_count: number;
  rate_limit: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  revoked_at: string | null;
};

export async function listApiKeys(): Promise<ApiKeyRow[]> {
  const r = await query<ApiKeyRow>(
    `SELECT k.id, k.label, k.key_prefix, k.scopes, k.is_active,
            k.expires_at::text, k.last_used_at::text, k.request_count,
            k.rate_limit, k.created_by, u.full_name AS created_by_name,
            k.created_at::text, k.revoked_at::text
     FROM api_keys k
     JOIN app_users u ON u.id = k.created_by
     ORDER BY k.created_at DESC`,
    [],
  );
  return r.rows;
}

export async function createApiKey(
  label: string,
  keyHash: string,
  keyPrefix: string,
  scopes: string[],
  rateLimit: number,
  expiresAt: string | null,
  createdBy: number,
): Promise<number> {
  const r = await query<{ id: number }>(
    `INSERT INTO api_keys (label, key_hash, key_prefix, scopes, rate_limit, expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7)
     RETURNING id`,
    [label, keyHash, keyPrefix, scopes, rateLimit, expiresAt, createdBy],
  );
  return r.rows[0].id;
}

export async function revokeApiKey(id: number): Promise<void> {
  await query(
    `UPDATE api_keys SET is_active = FALSE, revoked_at = NOW() WHERE id = $1`,
    [id],
  );
}

export async function deleteApiKey(id: number): Promise<void> {
  await query(`DELETE FROM api_keys WHERE id = $1`, [id]);
}

export async function updateApiKey(
  id: number,
  label: string,
  scopes: string[],
  rateLimit: number,
  expiresAt: string | null,
): Promise<void> {
  await query(
    `UPDATE api_keys SET label = $1, scopes = $2, rate_limit = $3, expires_at = $4::timestamptz WHERE id = $5`,
    [label, scopes, rateLimit, expiresAt, id],
  );
}

export type ApiKeyAuth = {
  id: number;
  scopes: string[];
  rate_limit: number;
};

export async function validateApiKey(keyHash: string): Promise<ApiKeyAuth | null> {
  const r = await query<ApiKeyAuth>(
    `SELECT id, scopes, rate_limit
     FROM api_keys
     WHERE key_hash = $1
       AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [keyHash],
  );
  if (!r.rowCount) return null;

  // Touch last_used_at + bump counter (fire-and-forget, no await needed for perf)
  query(
    `UPDATE api_keys SET last_used_at = NOW(), request_count = request_count + 1 WHERE id = $1`,
    [r.rows[0].id],
  ).catch(() => {});

  return r.rows[0];
}

export async function checkRateLimit(keyId: number, limit: number): Promise<boolean> {
  // Sliding window: 1-minute buckets
  const windowStart = new Date();
  windowStart.setSeconds(0, 0); // truncate to minute

  const r = await query<{ hit_count: number }>(
    `INSERT INTO api_rate_limits (key_id, window_start, hit_count)
     VALUES ($1, $2, 1)
     ON CONFLICT (key_id, window_start)
     DO UPDATE SET hit_count = api_rate_limits.hit_count + 1
     RETURNING hit_count`,
    [keyId, windowStart.toISOString()],
  );

  return r.rows[0].hit_count <= limit;
}

export async function logApiRequest(
  keyId: number,
  method: string,
  path: string,
  statusCode: number,
  ipAddress: string | null,
  userAgent: string | null,
  responseMs: number,
): Promise<void> {
  await query(
    `INSERT INTO api_audit_log (key_id, method, path, status_code, ip_address, user_agent, response_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [keyId, method, path, statusCode, ipAddress, userAgent, responseMs],
  );
}

export type ApiAuditEntry = {
  id: number;
  method: string;
  path: string;
  status_code: number;
  ip_address: string | null;
  response_ms: number;
  created_at: string;
};

export async function listApiAuditLog(keyId: number, limit = 50): Promise<ApiAuditEntry[]> {
  const r = await query<ApiAuditEntry>(
    `SELECT id, method, path, status_code, ip_address, response_ms, created_at::text
     FROM api_audit_log WHERE key_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [keyId, limit],
  );
  return r.rows;
}
