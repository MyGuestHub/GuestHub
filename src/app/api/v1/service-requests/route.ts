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

/** GET /api/v1/service-requests — List service requests */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "requests.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const roomId = searchParams.get("room_id");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  let sql = `SELECT sr.id, sr.guest_id, g.full_name AS guest_name,
                    sr.room_id, rm.room_number,
                    sc.name_en AS category_name_en, sc.name_ar AS category_name_ar,
                    si.name_en AS item_name_en, si.name_ar AS item_name_ar,
                    sr.quantity, sr.notes, sr.request_status,
                    sr.assigned_to, sr.created_at::text,
                    sr.completed_at::text, sr.cancelled_at::text,
                    sr.cancellation_reason
             FROM service_requests sr
             JOIN guests g ON g.id = sr.guest_id
             JOIN rooms rm ON rm.id = sr.room_id
             JOIN service_items si ON si.id = sr.service_item_id
             JOIN service_categories sc ON sc.id = si.category_id
             WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 0;

  if (status) { idx++; sql += ` AND sr.request_status = $${idx}`; params.push(status); }
  if (roomId) { idx++; sql += ` AND sr.room_id = $${idx}`; params.push(Number(roomId)); }

  idx++;
  sql += ` ORDER BY sr.created_at DESC LIMIT $${idx}`;
  params.push(limit);
  idx++;
  sql += ` OFFSET $${idx}`;
  params.push(offset);

  const r = await query(sql, params);
  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows);
}

/** POST /api/v1/service-requests — Create a service request */
export async function POST(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "requests.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const reservationId = Number(body.reservation_id);
  const roomId = Number(body.room_id);
  const guestId = Number(body.guest_id);
  const serviceItemId = Number(body.service_item_id);

  if (!Number.isFinite(reservationId) || !Number.isFinite(roomId) ||
      !Number.isFinite(guestId) || !Number.isFinite(serviceItemId)) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "reservation_id, room_id, guest_id, and service_item_id are required");
  }

  const quantity = Math.max(1, Number(body.quantity) || 1);
  const notes = body.notes ? String(body.notes).trim() : null;
  const scheduledAt = body.scheduled_at ? String(body.scheduled_at).trim() : null;

  try {
    const r = await query(
      `INSERT INTO service_requests (reservation_id, room_id, guest_id, service_item_id, quantity, notes, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, reservation_id, room_id, guest_id, service_item_id, quantity, notes,
                 request_status, scheduled_at::text, created_at::text`,
      [reservationId, roomId, guestId, serviceItemId, quantity, notes, scheduledAt],
    );
    auditLog(authResult.keyId, req, 201, start);
    return apiSuccess(r.rows[0], 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("violates foreign key")) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", "Invalid reservation_id, room_id, guest_id, or service_item_id");
    }
    throw e;
  }
}
