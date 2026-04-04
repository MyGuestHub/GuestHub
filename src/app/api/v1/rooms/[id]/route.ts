import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
  auditLog,
} from "@/lib/api-auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/v1/rooms/[id] — Get a single room by ID */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "rooms.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const { id } = await params;
  const roomId = Number(id);
  if (!Number.isFinite(roomId)) {
    auditLog(authResult.keyId, req, 400, start);
    return new Response(JSON.stringify({ error: { code: "INVALID_ID", message: "Invalid room ID" } }), { status: 400 });
  }

  const r = await query(
    `SELECT id, room_number, floor, room_type, capacity, status, amenities, created_at::text
     FROM rooms WHERE id = $1`,
    [roomId],
  );

  if (!r.rowCount) {
    auditLog(authResult.keyId, req, 404, start);
    return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Room not found" } }), { status: 404 });
  }

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(r.rows[0]);
}
