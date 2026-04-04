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

/** GET /api/v1/invoices/[id] — Get a single invoice */
export async function GET(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "invoices.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const invId = await resolveId(params);
  if (!Number.isFinite(invId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid invoice ID");
  }

  const r = await query(
    `SELECT inv.id, inv.reservation_id, inv.guest_id, inv.room_id,
            g.full_name AS guest_name, rm.room_number,
            inv.subtotal::text, inv.tax_rate::text, inv.tax_amount::text,
            inv.total::text, inv.currency, inv.status,
            inv.notes, inv.created_at::text, inv.closed_at::text
     FROM invoices inv
     JOIN guests g ON g.id = inv.guest_id
     JOIN rooms rm ON rm.id = inv.room_id
     WHERE inv.id = $1`,
    [invId],
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Invoice not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}

/** PUT /api/v1/invoices/[id] — Update an invoice (status, notes) */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "invoices.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const invId = await resolveId(params);
  if (!Number.isFinite(invId)) {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_ID", "Invalid invoice ID");
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 0;

  const validStatuses = ["open", "closed", "paid"];
  if (body.status !== undefined) {
    if (!validStatuses.includes(String(body.status))) {
      auditLog(authResult.keyId, req, 422, start);
      return apiError(422, "VALIDATION_ERROR", `status must be one of: ${validStatuses.join(", ")}`);
    }
    const st = String(body.status);
    idx++; sets.push(`status = $${idx}`); vals.push(st);
    if (st === "closed" || st === "paid") { sets.push(`closed_at = COALESCE(closed_at, NOW())`); }
  }
  if (body.subtotal !== undefined) { idx++; sets.push(`subtotal = $${idx}`); vals.push(Number(body.subtotal)); }
  if (body.tax_rate !== undefined) { idx++; sets.push(`tax_rate = $${idx}`); vals.push(Number(body.tax_rate)); }
  if (body.tax_amount !== undefined) { idx++; sets.push(`tax_amount = $${idx}`); vals.push(Number(body.tax_amount)); }
  if (body.total !== undefined) { idx++; sets.push(`total = $${idx}`); vals.push(Number(body.total)); }
  if (body.notes !== undefined) { idx++; sets.push(`notes = $${idx}`); vals.push(body.notes ? String(body.notes).trim() : null); }

  if (!sets.length) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "No fields to update");
  }

  idx++;
  vals.push(invId);
  const r = await query(
    `UPDATE invoices SET ${sets.join(", ")} WHERE id = $${idx}
     RETURNING id, reservation_id, subtotal::text, tax_rate::text, tax_amount::text,
               total::text, currency, status, notes, created_at::text, closed_at::text`,
    vals,
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return apiError(404, "NOT_FOUND", "Invoice not found");
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}
