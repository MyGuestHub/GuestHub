import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
  auditLog,
} from "@/lib/api-auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/v1/reservations — List reservations */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "reservations.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status"); // booked, checked_in, checked_out, cancelled
  const roomId = searchParams.get("room_id");
  const guestId = searchParams.get("guest_id");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  let sql = `SELECT r.id, r.guest_id, g.full_name AS guest_name,
                    r.room_id, rm.room_number,
                    r.check_in::text, r.check_out::text,
                    r.reservation_status, r.adults, r.children,
                    r.notes, r.dnd_active, r.created_at::text
             FROM reservations r
             JOIN guests g ON g.id = r.guest_id
             JOIN rooms rm ON rm.id = r.room_id
             WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 0;

  if (status) { idx++; sql += ` AND r.reservation_status = $${idx}`; params.push(status); }
  if (roomId) { idx++; sql += ` AND r.room_id = $${idx}`; params.push(Number(roomId)); }
  if (guestId) { idx++; sql += ` AND r.guest_id = $${idx}`; params.push(Number(guestId)); }

  idx++;
  sql += ` ORDER BY r.created_at DESC LIMIT $${idx}`;
  params.push(limit);
  idx++;
  sql += ` OFFSET $${idx}`;
  params.push(offset);

  const r = await query(sql, params);
  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows);
}
