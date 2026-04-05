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

/** GET /api/v1/service-requests/[id] — Get a single service request */
export async function GET(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "requests.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const srId = await resolveId(params);
  if (!Number.isFinite(srId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid service request ID");
  }

  const r = await query(
    `SELECT sr.id, sr.guest_id, (g.first_name || ' ' || g.last_name) AS guest_name,
            sr.room_id, rm.room_number,
            sc.name_en AS category_name_en, si.name_en AS item_name_en,
            sr.quantity, sr.notes, sr.request_status,
            sr.assigned_to, sr.scheduled_at::text,
            sr.created_at::text, sr.completed_at::text,
            sr.cancelled_at::text, sr.cancellation_reason
     FROM service_requests sr
     JOIN guests g ON g.id = sr.guest_id
     JOIN rooms rm ON rm.id = sr.room_id
     JOIN service_items si ON si.id = sr.service_item_id
     JOIN service_categories sc ON sc.id = si.category_id
     WHERE sr.id = $1`,
    [srId],
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Service request not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}

/** PUT /api/v1/service-requests/[id] — Update a service request */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "requests.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const srId = await resolveId(params);
  if (!Number.isFinite(srId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid service request ID");
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 0;

  const validStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled"];
  if (body.request_status !== undefined) {
    if (!validStatuses.includes(String(body.request_status))) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", `request_status must be one of: ${validStatuses.join(", ")}`);
    }
    const st = String(body.request_status);
    idx++; sets.push(`request_status = $${idx}`); vals.push(st);
    if (st === "completed") { sets.push(`completed_at = NOW()`); }
    if (st === "cancelled") {
      sets.push(`cancelled_at = NOW()`);
      if (body.cancellation_reason) {
        idx++; sets.push(`cancellation_reason = $${idx}`); vals.push(String(body.cancellation_reason).trim());
      }
    }
  }
  if (body.assigned_to !== undefined) {
    idx++; sets.push(`assigned_to = $${idx}`);
    vals.push(body.assigned_to ? Number(body.assigned_to) : null);
  }
  if (body.notes !== undefined) { idx++; sets.push(`notes = $${idx}`); vals.push(body.notes ? String(body.notes).trim() : null); }
  if (body.quantity !== undefined) { idx++; sets.push(`quantity = $${idx}`); vals.push(Math.max(1, Number(body.quantity) || 1)); }

  sets.push(`updated_at = NOW()`);

  if (sets.length <= 1) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "No fields to update");
  }

  idx++;
  vals.push(srId);
  const r = await query(
    `UPDATE service_requests SET ${sets.join(", ")} WHERE id = $${idx}
     RETURNING id, request_status, assigned_to, notes, quantity,
               completed_at::text, cancelled_at::text, updated_at::text`,
    vals,
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Service request not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}
