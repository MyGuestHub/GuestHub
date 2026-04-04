import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
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
                    ht.task_type, ht.status, ht.priority,
                    ht.assigned_to, u.full_name AS assigned_to_name,
                    ht.notes, ht.created_at::text, ht.completed_at::text
             FROM housekeeping_tasks ht
             JOIN rooms rm ON rm.id = ht.room_id
             LEFT JOIN app_users u ON u.id = ht.assigned_to
             WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 0;

  if (status) { idx++; sql += ` AND ht.status = $${idx}`; params.push(status); }
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
