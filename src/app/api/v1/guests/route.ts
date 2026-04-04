import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
  auditLog,
} from "@/lib/api-auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/v1/guests — List guests */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "guests.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  let sql = `SELECT id, first_name, last_name, full_name, email, phone, nationality, id_type, id_number, created_at::text
             FROM guests WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 0;

  if (search) {
    idx++;
    sql += ` AND (full_name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`;
    params.push(`%${search}%`);
  }

  idx++;
  sql += ` ORDER BY created_at DESC LIMIT $${idx}`;
  params.push(limit);
  idx++;
  sql += ` OFFSET $${idx}`;
  params.push(offset);

  const r = await query(sql, params);
  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows);
}
