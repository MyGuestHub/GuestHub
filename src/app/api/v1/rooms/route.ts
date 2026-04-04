import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
  auditLog,
} from "@/lib/api-auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/v1/rooms — List all rooms */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "rooms.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status"); // active, maintenance, inactive
  const floor = searchParams.get("floor");

  let sql = `SELECT id, room_number, floor, room_type, capacity, status, amenities, created_at::text
             FROM rooms WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 0;

  if (status) { idx++; sql += ` AND status = $${idx}`; params.push(status); }
  if (floor) { idx++; sql += ` AND floor = $${idx}`; params.push(Number(floor)); }

  sql += ` ORDER BY room_number`;

  const r = await query(sql, params);
  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows);
}
