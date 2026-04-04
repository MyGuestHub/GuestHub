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

/** GET /api/v1/housekeeping/[id] — Get a single housekeeping task */
export async function GET(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "housekeeping.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const taskId = await resolveId(params);
  if (!Number.isFinite(taskId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid task ID");
  }

  const r = await query(
    `SELECT ht.id, ht.room_id, rm.room_number,
            ht.task_type, ht.task_status, ht.priority,
            ht.assigned_to, u.full_name AS assigned_to_name,
            ht.notes, ht.created_at::text, ht.started_at::text, ht.completed_at::text
     FROM housekeeping_tasks ht
     JOIN rooms rm ON rm.id = ht.room_id
     LEFT JOIN app_users u ON u.id = ht.assigned_to
     WHERE ht.id = $1`,
    [taskId],
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Housekeeping task not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}

/** PUT /api/v1/housekeeping/[id] — Update a housekeeping task */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "housekeeping.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const taskId = await resolveId(params);
  if (!Number.isFinite(taskId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid task ID");
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 0;

  const validStatuses = ["pending", "in_progress", "done", "verified"];
  if (body.task_status !== undefined) {
    if (!validStatuses.includes(String(body.task_status))) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", `task_status must be one of: ${validStatuses.join(", ")}`);
    }
    const st = String(body.task_status);
    idx++; sets.push(`task_status = $${idx}`); vals.push(st);
    if (st === "in_progress") { sets.push(`started_at = COALESCE(started_at, NOW())`); }
    if (st === "done" || st === "verified") { sets.push(`completed_at = COALESCE(completed_at, NOW())`); }
  }

  const validPriorities = ["low", "normal", "high", "urgent"];
  if (body.priority !== undefined) {
    if (!validPriorities.includes(String(body.priority))) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", `priority must be one of: ${validPriorities.join(", ")}`);
    }
    idx++; sets.push(`priority = $${idx}`); vals.push(String(body.priority));
  }

  if (body.assigned_to !== undefined) {
    idx++; sets.push(`assigned_to = $${idx}`);
    vals.push(body.assigned_to ? Number(body.assigned_to) : null);
  }
  if (body.notes !== undefined) { idx++; sets.push(`notes = $${idx}`); vals.push(body.notes ? String(body.notes).trim() : null); }

  if (!sets.length) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "No fields to update");
  }

  idx++;
  vals.push(taskId);
  const r = await query(
    `UPDATE housekeeping_tasks SET ${sets.join(", ")} WHERE id = $${idx}
     RETURNING id, room_id, task_type, task_status, priority, assigned_to, notes,
               created_at::text, started_at::text, completed_at::text`,
    vals,
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Housekeeping task not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}

/** DELETE /api/v1/housekeeping/[id] — Delete a housekeeping task */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "housekeeping.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const taskId = await resolveId(params);
  if (!Number.isFinite(taskId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid task ID");
  }

  const r = await query(`DELETE FROM housekeeping_tasks WHERE id = $1 RETURNING id`, [taskId]);

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Housekeeping task not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess({ deleted: true, id: taskId });
}
