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

/** GET /api/v1/rooms — List all rooms */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "rooms.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
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

/** POST /api/v1/rooms — Create a room */
export async function POST(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "rooms.write");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    auditLog(authResult.keyId, req, 400, start);
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const roomNumber = String(body.room_number ?? "").trim();
  if (!roomNumber) {
    auditLog(authResult.keyId, req, 422, start);
    return apiError(422, "VALIDATION_ERROR", "room_number is required");
  }

  const floor = body.floor != null ? Number(body.floor) : null;
  const roomType = String(body.room_type ?? "standard").trim();
  const capacity = Math.max(1, Number(body.capacity) || 2);
  const status = body.status === "maintenance" ? "maintenance" : "active";

  try {
    const r = await query(
      `INSERT INTO rooms (room_number, floor, room_type, capacity, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, room_number, floor, room_type, capacity, status, created_at::text`,
      [roomNumber, floor, roomType, capacity, status],
    );
    auditLog(authResult.keyId, req, 201, start);
    return apiSuccess(r.rows[0], 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      auditLog(authResult.keyId, req, 409, start);
      return apiError(409, "DUPLICATE", "A room with this number already exists");
    }
    throw e;
  }
}
