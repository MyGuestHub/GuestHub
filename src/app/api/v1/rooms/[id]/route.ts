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

/** GET /api/v1/rooms/[id] — Get a single room by ID */
export async function GET(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "rooms.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const roomId = await resolveId(params);
  if (!Number.isFinite(roomId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid room ID");
  }

  const r = await query(
    `SELECT id, room_number, floor, room_type, capacity, status, amenities, created_at::text
     FROM rooms WHERE id = $1`,
    [roomId],
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Room not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}

/** PUT /api/v1/rooms/[id] — Update a room */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "rooms.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const roomId = await resolveId(params);
  if (!Number.isFinite(roomId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid room ID");
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 0;

  if (body.room_number !== undefined) { idx++; sets.push(`room_number = $${idx}`); vals.push(String(body.room_number).trim()); }
  if (body.floor !== undefined) { idx++; sets.push(`floor = $${idx}`); vals.push(Number(body.floor)); }
  if (body.room_type !== undefined) { idx++; sets.push(`room_type = $${idx}`); vals.push(String(body.room_type).trim()); }
  if (body.capacity !== undefined) { idx++; sets.push(`capacity = $${idx}`); vals.push(Math.max(1, Number(body.capacity) || 1)); }
  if (body.status !== undefined) { idx++; sets.push(`status = $${idx}`); vals.push(String(body.status).trim()); }

  if (!sets.length) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "No fields to update");
  }

  idx++;
  vals.push(roomId);
  const r = await query(
    `UPDATE rooms SET ${sets.join(", ")} WHERE id = $${idx}
     RETURNING id, room_number, floor, room_type, capacity, status, amenities, created_at::text`,
    vals,
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Room not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}

/** DELETE /api/v1/rooms/[id] — Delete a room */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "rooms.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const roomId = await resolveId(params);
  if (!Number.isFinite(roomId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid room ID");
  }

  const r = await query(`DELETE FROM rooms WHERE id = $1 RETURNING id`, [roomId]);

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Room not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess({ deleted: true, id: roomId });
}
