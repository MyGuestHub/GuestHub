import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
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
