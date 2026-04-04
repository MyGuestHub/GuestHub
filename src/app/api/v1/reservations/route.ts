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

/** GET /api/v1/reservations — List reservations */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "reservations.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const roomId = searchParams.get("room_id");
  const guestId = searchParams.get("guest_id");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  let sql = `SELECT r.id, r.guest_id, g.full_name AS guest_name,
                    r.room_id, rm.room_number,
                    r.check_in::text, r.check_out::text,
                    r.reservation_status, r.adults, r.children,
                    r.notes, r.dnd_active, r.created_at::text
             FROM reservations r
             JOIN guests g ON g.id = r.guest_id
             JOIN rooms rm ON rm.id = r.room_id
             WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 0;

  if (status) { idx++; sql += ` AND r.reservation_status = $${idx}`; params.push(status); }
  if (roomId) { idx++; sql += ` AND r.room_id = $${idx}`; params.push(Number(roomId)); }
  if (guestId) { idx++; sql += ` AND r.guest_id = $${idx}`; params.push(Number(guestId)); }

  idx++;
  sql += ` ORDER BY r.created_at DESC LIMIT $${idx}`;
  params.push(limit);
  idx++;
  sql += ` OFFSET $${idx}`;
  params.push(offset);

  const r = await query(sql, params);
  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows);
}

/** POST /api/v1/reservations — Create a reservation */
export async function POST(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "reservations.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const guestId = Number(body.guest_id);
  const roomId = Number(body.room_id);
  const checkIn = String(body.check_in ?? "").trim();
  const checkOut = String(body.check_out ?? "").trim();

  if (!Number.isFinite(guestId) || !Number.isFinite(roomId) || !checkIn || !checkOut) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "guest_id, room_id, check_in, and check_out are required");
  }

  const status = ["booked", "checked_in"].includes(String(body.status ?? ""))
    ? String(body.status)
    : "booked";
  const adults = Math.max(1, Number(body.adults) || 1);
  const children = Math.max(0, Number(body.children) || 0);
  const notes = body.notes ? String(body.notes).trim() : null;

  try {
    const r = await query(
      `INSERT INTO reservations (guest_id, room_id, check_in, check_out, reservation_status, adults, children, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, guest_id, room_id, check_in::text, check_out::text,
                 reservation_status, adults, children, notes, created_at::text`,
      [guestId, roomId, checkIn, checkOut, status, adults, children, notes],
    );
    auditLog(authResult.keyId, req, 201, start);
    return apiSuccess(r.rows[0], 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("violates foreign key")) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", "Invalid guest_id or room_id");
    }
    if (msg.includes("check_dates_valid")) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", "check_out must be after check_in");
    }
    throw e;
  }
}
