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

/** GET /api/v1/guests/[id] — Get a single guest */
export async function GET(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "guests.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const guestId = await resolveId(params);
  if (!Number.isFinite(guestId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid guest ID");
  }

  const r = await query(
    `SELECT id, first_name, last_name, email, phone, notes, created_at::text
     FROM guests WHERE id = $1`,
    [guestId],
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Guest not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}

/** PUT /api/v1/guests/[id] — Update a guest */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "guests.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const guestId = await resolveId(params);
  if (!Number.isFinite(guestId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid guest ID");
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 0;

  if (body.first_name !== undefined) { idx++; sets.push(`first_name = $${idx}`); vals.push(String(body.first_name).trim()); }
  if (body.last_name !== undefined) { idx++; sets.push(`last_name = $${idx}`); vals.push(String(body.last_name).trim()); }
  if (body.phone !== undefined) { idx++; sets.push(`phone = $${idx}`); vals.push(body.phone ? String(body.phone).trim() : null); }
  if (body.email !== undefined) { idx++; sets.push(`email = $${idx}`); vals.push(body.email ? String(body.email).trim() : null); }
  if (body.notes !== undefined) { idx++; sets.push(`notes = $${idx}`); vals.push(body.notes ? String(body.notes).trim() : null); }

  if (!sets.length) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "No fields to update");
  }

  idx++;
  vals.push(guestId);
  const r = await query(
    `UPDATE guests SET ${sets.join(", ")} WHERE id = $${idx}
     RETURNING id, first_name, last_name, phone, email, notes, created_at::text`,
    vals,
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Guest not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}

/** DELETE /api/v1/guests/[id] — Delete a guest */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "guests.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const guestId = await resolveId(params);
  if (!Number.isFinite(guestId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid guest ID");
  }

  try {
    const r = await query(`DELETE FROM guests WHERE id = $1 RETURNING id`, [guestId]);
    if (!r.rowCount) {
      auditLog(authResult.keyId, req, 404, start);
      return apiError(404, "NOT_FOUND", "Guest not found");
    }
    auditLog(authResult.keyId, req, 200, start);
    return apiSuccess({ deleted: true, id: guestId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("violates foreign key")) {
      auditLog(authResult.keyId, req, 409, start);
      return apiError(409, "CONFLICT", "Cannot delete guest with existing reservations");
    }
    throw e;
  }
}
