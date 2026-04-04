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

type Ctx = { params: Promise<{ id: string }> };

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

/** GET /api/v1/reservations/[id] — Get a single reservation */
export async function GET(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "reservations.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const resId = await resolveId(params);
  if (!Number.isFinite(resId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid reservation ID");
  }

  const r = await query(
    `SELECT r.id, r.guest_id, g.full_name AS guest_name,
            r.room_id, rm.room_number,
            r.check_in::text, r.check_out::text,
            r.reservation_status, r.adults, r.children,
            r.notes, r.dnd_active, r.created_at::text
     FROM reservations r
     JOIN guests g ON g.id = r.guest_id
     JOIN rooms rm ON rm.id = r.room_id
     WHERE r.id = $1`,
    [resId],
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Reservation not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}

/** PUT /api/v1/reservations/[id] — Update a reservation */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "reservations.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const resId = await resolveId(params);
  if (!Number.isFinite(resId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid reservation ID");
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 0;

  const validStatuses = ["booked", "checked_in", "checked_out", "cancelled"];
  if (body.reservation_status !== undefined) {
    if (!validStatuses.includes(String(body.reservation_status))) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", `reservation_status must be one of: ${validStatuses.join(", ")}`);
    }
    idx++; sets.push(`reservation_status = $${idx}`); vals.push(String(body.reservation_status));
  }
  if (body.check_in !== undefined) { idx++; sets.push(`check_in = $${idx}`); vals.push(String(body.check_in)); }
  if (body.check_out !== undefined) { idx++; sets.push(`check_out = $${idx}`); vals.push(String(body.check_out)); }
  if (body.adults !== undefined) { idx++; sets.push(`adults = $${idx}`); vals.push(Math.max(1, Number(body.adults) || 1)); }
  if (body.children !== undefined) { idx++; sets.push(`children = $${idx}`); vals.push(Math.max(0, Number(body.children) || 0)); }
  if (body.notes !== undefined) { idx++; sets.push(`notes = $${idx}`); vals.push(body.notes ? String(body.notes).trim() : null); }
  if (body.dnd_active !== undefined) { idx++; sets.push(`dnd_active = $${idx}`); vals.push(Boolean(body.dnd_active)); }

  if (!sets.length) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "No fields to update");
  }

  idx++;
  vals.push(resId);
  try {
    const r = await query(
      `UPDATE reservations SET ${sets.join(", ")} WHERE id = $${idx}
       RETURNING id, guest_id, room_id, check_in::text, check_out::text,
                 reservation_status, adults, children, notes, dnd_active, created_at::text`,
      vals,
    );

    if (!r.rowCount) {
      auditLog(authResult.keyId, req, 404, start);
      return apiError(404, "NOT_FOUND", "Reservation not found");
    }

    auditLog(authResult.keyId, req, 200, start);
    return apiSuccess(r.rows[0]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("check_dates_valid")) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", "check_out must be after check_in");
    }
    throw e;
  }
}

/** DELETE /api/v1/reservations/[id] — Cancel a reservation */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "reservations.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const resId = await resolveId(params);
  if (!Number.isFinite(resId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid reservation ID");
  }

  const r = await query(
    `UPDATE reservations SET reservation_status = 'cancelled', cancelled_at = NOW()
     WHERE id = $1 AND reservation_status NOT IN ('checked_out', 'cancelled')
     RETURNING id, reservation_status`,
    [resId],
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Reservation not found or already cancelled/checked out");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess({ cancelled: true, id: resId });
}
