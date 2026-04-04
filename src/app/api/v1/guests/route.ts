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

/** POST /api/v1/guests — Create a guest */
export async function POST(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "guests.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const firstName = String(body.first_name ?? "").trim();
  const lastName = String(body.last_name ?? "").trim();
  if (!firstName || !lastName) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "first_name and last_name are required");
  }

  const phone = body.phone ? String(body.phone).trim() : null;
  const email = body.email ? String(body.email).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  const r = await query(
    `INSERT INTO guests (first_name, last_name, phone, email, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, first_name, last_name, phone, email, notes, created_at::text`,
    [firstName, lastName, phone, email, notes],
  );

  auditLog(authResult.keyId, req, 201, start);
  return apiSuccess(r.rows[0], 201);
}
