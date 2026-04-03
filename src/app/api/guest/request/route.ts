import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query, tx } from "@/lib/db";
import { cleanText } from "@/lib/http";
import { resolveLang, tr } from "@/lib/i18n";
import { isRoomQrToken, validateGuestSession, validateGuestToken } from "@/lib/data";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const token = cleanText(form.get("token"));

  // For room QR tokens, validate via session cookie instead of bare token
  let guest;
  const isRoom = await isRoomQrToken(token);
  if (isRoom) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("guest_session")?.value;
    guest = sessionCookie ? await validateGuestSession(sessionCookie) : null;
  } else {
    guest = await validateGuestToken(token);
  }

  if (!guest) {
    return NextResponse.json(
      { error: tr(lang, "رابط الوصول غير صالح أو منتهي", "Invalid or expired access link") },
      { status: 403 },
    );
  }

  const serviceItemId = Number.parseInt(cleanText(form.get("serviceItemId")), 10);
  const quantity = Math.max(1, Number.parseInt(cleanText(form.get("quantity")) || "1", 10));
  const notes = cleanText(form.get("notes")) || null;
  const scheduledAt = cleanText(form.get("scheduledAt")) || null;

  if (!Number.isFinite(serviceItemId)) {
    return NextResponse.json(
      { error: tr(lang, "خدمة غير صالحة", "Invalid service item") },
      { status: 400 },
    );
  }

  // Verify item exists and is active
  const item = await query(
    `SELECT id, estimated_cost FROM service_items WHERE id = $1 AND is_active = TRUE`,
    [serviceItemId],
  );

  if (!item.rowCount) {
    return NextResponse.json(
      { error: tr(lang, "الخدمة غير متوفرة", "Service not available") },
      { status: 400 },
    );
  }

  const estimatedCost = item.rows[0].estimated_cost;
  const parsedSchedule = scheduledAt ? new Date(scheduledAt) : null;

  const result = await tx(async (client) => {
    const insert = await client.query(
      `INSERT INTO service_requests
         (reservation_id, room_id, guest_id, service_item_id, notes, scheduled_at, quantity, estimated_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        guest.reservationId,
        guest.roomId,
        guest.guestId,
        serviceItemId,
        notes,
        parsedSchedule?.toISOString() ?? null,
        quantity,
        estimatedCost,
      ],
    );

    const newId = insert.rows[0].id;

    await client.query(
      `INSERT INTO service_request_logs (service_request_id, old_status, new_status, note)
       VALUES ($1, NULL, 'pending', $2)`,
      [newId, notes],
    );

    return newId;
  });

  return NextResponse.json({
    ok: true,
    message: tr(lang, "تم إرسال طلبك بنجاح", "Your request has been submitted successfully"),
    requestId: result,
  });
}
