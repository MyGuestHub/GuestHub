import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
  auditLog,
} from "@/lib/api-auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/v1/invoices — List invoices */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "invoices.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { searchParams } = req.nextUrl;
  const reservationId = searchParams.get("reservation_id");
  const status = searchParams.get("status");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  let sql = `SELECT inv.id, inv.reservation_id,
                    g.full_name AS guest_name, rm.room_number,
                    inv.invoice_number, inv.total::text, inv.status,
                    inv.issued_at::text, inv.paid_at::text
             FROM invoices inv
             JOIN reservations res ON res.id = inv.reservation_id
             JOIN guests g ON g.id = res.guest_id
             JOIN rooms rm ON rm.id = res.room_id
             WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 0;

  if (reservationId) { idx++; sql += ` AND inv.reservation_id = $${idx}`; params.push(Number(reservationId)); }
  if (status) { idx++; sql += ` AND inv.status = $${idx}`; params.push(status); }

  idx++;
  sql += ` ORDER BY inv.issued_at DESC LIMIT $${idx}`;
  params.push(limit);
  idx++;
  sql += ` OFFSET $${idx}`;
  params.push(offset);

  const r = await query(sql, params);
  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows);
}
