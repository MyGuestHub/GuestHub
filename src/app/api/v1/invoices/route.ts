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
                    (g.first_name || ' ' || g.last_name) AS guest_name, rm.room_number,
                    inv.subtotal::text, inv.tax_rate::text, inv.tax_amount::text,
                    inv.total::text, inv.currency, inv.status,
                    inv.notes, inv.closed_at::text, inv.created_at::text
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
  sql += ` ORDER BY inv.created_at DESC LIMIT $${idx}`;
  params.push(limit);
  idx++;
  sql += ` OFFSET $${idx}`;
  params.push(offset);

  const r = await query(sql, params);
  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows);
}

/** POST /api/v1/invoices — Create an invoice */
export async function POST(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "invoices.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const reservationId = Number(body.reservation_id);
  if (!Number.isFinite(reservationId)) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "reservation_id is required");
  }

  // Look up guest_id and room_id from the reservation
  const res = await query(
    `SELECT guest_id, room_id FROM reservations WHERE id = $1`,
    [reservationId],
  );
  if (!res.rowCount) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "Invalid reservation_id");
  }
  const { guest_id: guestId, room_id: roomId } = res.rows[0] as { guest_id: number; room_id: number };

  const subtotal = Math.max(0, Number(body.subtotal) || 0);
  const taxRate = Math.max(0, Number(body.tax_rate) || 0.05);
  const taxAmount = body.tax_amount != null ? Number(body.tax_amount) : +(subtotal * taxRate).toFixed(2);
  const total = body.total != null ? Number(body.total) : +(subtotal + taxAmount).toFixed(2);
  const currency = String(body.currency ?? "USD").trim().toUpperCase();
  const notes = body.notes ? String(body.notes).trim() : null;

  const r = await query(
    `INSERT INTO invoices (reservation_id, guest_id, room_id, subtotal, tax_rate, tax_amount, total, currency, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, reservation_id, guest_id, room_id,
               subtotal::text, tax_rate::text, tax_amount::text, total::text,
               currency, status, notes, created_at::text`,
    [reservationId, guestId, roomId, subtotal, taxRate, taxAmount, total, currency, notes],
  );

  auditLog(authResult.keyId, req, 201, start);
  return apiSuccess(r.rows[0], 201);
}
