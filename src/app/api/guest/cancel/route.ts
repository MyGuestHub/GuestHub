import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { tx } from "@/lib/db";
import { validateGuestSession } from "@/lib/data";

/**
 * Guest cancellation API.
 * Policy:
 *  - Only `pending` and `accepted` requests can be cancelled by the guest.
 *  - `in_progress`, `completed`, and already `cancelled` requests are rejected.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const requestId = Number(body.requestId);
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

  if (!Number.isFinite(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("guest_session")?.value;
  const guest = sessionCookie ? await validateGuestSession(sessionCookie) : null;

  if (!guest) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await tx(async (client) => {
    // Fetch the request — must belong to this guest's reservation
    const row = await client.query<{ request_status: string }>(
      `SELECT request_status
       FROM service_requests
       WHERE id = $1 AND reservation_id = $2
       FOR UPDATE`,
      [requestId, guest.reservationId],
    );

    if (!row.rowCount) {
      return { error: "not_found" } as const;
    }

    const currentStatus = row.rows[0].request_status;

    // Policy: only pending and accepted can be cancelled by guest
    if (currentStatus !== "pending" && currentStatus !== "accepted") {
      return { error: "not_cancellable", currentStatus } as const;
    }

    // Cancel the request
    await client.query(
      `UPDATE service_requests
       SET request_status = 'cancelled',
           cancelled_at = NOW(),
           cancellation_reason = $1,
           cancelled_by_guest = TRUE,
           updated_at = NOW()
       WHERE id = $2`,
      [reason || null, requestId],
    );

    // Log the cancellation
    await client.query(
      `INSERT INTO service_request_logs
         (service_request_id, old_status, new_status, changed_by, note)
       VALUES ($1, $2, 'cancelled', NULL, $3)`,
      [requestId, currentStatus, reason ? `Guest cancelled: ${reason}` : "Guest cancelled"],
    );

    return { ok: true } as const;
  });

  if ("error" in result) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Cannot cancel this request", status: result.currentStatus },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
