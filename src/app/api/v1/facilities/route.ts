import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
  apiError,
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
  const date = searchParams.get("date");

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

/** POST /api/v1/facilities — Create a facility booking */
export async function POST(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "facilities.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const facilityId = Number(body.facility_id);
  const reservationId = Number(body.reservation_id);
  const guestId = Number(body.guest_id);
  const bookingDate = String(body.booking_date ?? "").trim();
  const startTime = String(body.start_time ?? "").trim();
  const endTime = String(body.end_time ?? "").trim();

  if (!Number.isFinite(facilityId) || !Number.isFinite(reservationId) ||
      !Number.isFinite(guestId) || !bookingDate || !startTime || !endTime) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "facility_id, reservation_id, guest_id, booking_date, start_time, and end_time are required");
  }

  const guestsCount = Math.max(1, Number(body.guests_count) || 1);
  const notes = body.notes ? String(body.notes).trim() : null;

  try {
    const r = await query(
      `INSERT INTO facility_bookings (facility_id, reservation_id, guest_id, booking_date, start_time, end_time, guests_count, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, facility_id, reservation_id, guest_id, booking_date::text, start_time::text, end_time::text,
                 guests_count, status, notes, created_at::text`,
      [facilityId, reservationId, guestId, bookingDate, startTime, endTime, guestsCount, notes],
    );
    auditLog(authResult.keyId, req, 201, start);
    return apiSuccess(r.rows[0], 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("violates foreign key")) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", "Invalid facility_id, reservation_id, or guest_id");
    }
    throw e;
  }
}
