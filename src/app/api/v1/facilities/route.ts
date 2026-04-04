import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
  auditLog,
} from "@/lib/api-auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/v1/facilities — List facility types and bookings */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "facilities.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date"); // YYYY-MM-DD

  const types = await query(
    `SELECT id, slug, name_en, name_ar, capacity, open_time::text, close_time::text,
            slot_duration_minutes, is_active
     FROM facility_types WHERE is_active = TRUE ORDER BY id`,
    [],
  );

  let bookingsSql = `SELECT fb.id, fb.facility_id, fb.reservation_id,
                            fb.booking_date::text, fb.start_time::text, fb.end_time::text,
                            fb.guests_count, fb.status, fb.created_at::text,
                            g.full_name AS guest_name, rm.room_number
                     FROM facility_bookings fb
                     JOIN reservations res ON res.id = fb.reservation_id
                     JOIN guests g ON g.id = fb.guest_id
                     JOIN rooms rm ON rm.id = res.room_id
                     WHERE fb.status = 'confirmed'`;
  const params: unknown[] = [];

  if (date) {
    bookingsSql += ` AND fb.booking_date = $1`;
    params.push(date);
  } else {
    bookingsSql += ` AND fb.booking_date >= CURRENT_DATE`;
  }

  bookingsSql += ` ORDER BY fb.booking_date, fb.start_time LIMIT 200`;

  const bookings = await query(bookingsSql, params);

  const result = types.rows.map((ft: Record<string, unknown>) => ({
    ...ft,
    bookings: bookings.rows.filter((b: Record<string, unknown>) => b.facility_id === ft.id),
  }));

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(result);
}
