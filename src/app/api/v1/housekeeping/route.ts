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

/** GET /api/v1/housekeeping — List housekeeping tasks */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "housekeeping.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  let sql = `SELECT ht.id, ht.room_id, rm.room_number,
                    ht.task_type, ht.task_status, ht.priority,
                    ht.assigned_to, u.full_name AS assigned_to_name,
                    ht.notes, ht.created_at::text, ht.completed_at::text
             FROM housekeeping_tasks ht
             JOIN rooms rm ON rm.id = ht.room_id
             LEFT JOIN app_users u ON u.id = ht.assigned_to
             WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 0;

  if (status) { idx++; sql += ` AND ht.task_status = $${idx}`; params.push(status); }
  if (priority) { idx++; sql += ` AND ht.priority = $${idx}`; params.push(priority); }

  idx++;
  sql += ` ORDER BY ht.created_at DESC LIMIT $${idx}`;
  params.push(limit);
  idx++;
  sql += ` OFFSET $${idx}`;
  params.push(offset);

  const r = await query(sql, params);
  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows);
}

/** POST /api/v1/housekeeping — Create a housekeeping task */
export async function POST(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "housekeeping.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const roomId = Number(body.room_id);
  if (!Number.isFinite(roomId)) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "room_id is required");
  }

  const validTypes = ["cleaning", "turndown", "inspection", "deep_clean"];
  const taskType = validTypes.includes(String(body.task_type ?? ""))
    ? String(body.task_type)
    : "cleaning";

  const validPriorities = ["low", "normal", "high", "urgent"];
  const priority = validPriorities.includes(String(body.priority ?? ""))
    ? String(body.priority)
    : "normal";

  const assignedTo = body.assigned_to ? Number(body.assigned_to) : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  try {
    const r = await query(
      `INSERT INTO housekeeping_tasks (room_id, task_type, priority, assigned_to, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, room_id, task_type, task_status, priority, assigned_to, notes, created_at::text`,
      [roomId, taskType, priority, assignedTo, notes],
    );
    auditLog(authResult.keyId, req, 201, start);
    return apiSuccess(r.rows[0], 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("violates foreign key")) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", "Invalid room_id or assigned_to user");
    }
    throw e;
  }
}
