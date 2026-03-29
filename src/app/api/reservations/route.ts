import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { query } from "@/lib/db";
import { cleanText } from "@/lib/http";
import { resolveLang, tr } from "@/lib/i18n";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const returnTo = cleanText(form.get("returnTo")) || `/${lang}/reservations`;

  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "guests.manage")) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "لا تملك صلاحية", "Access denied"))}`,
        request.url,
      ),
    );
  }

  const guestId = Number.parseInt(cleanText(form.get("guestId")), 10);
  const roomId = Number.parseInt(cleanText(form.get("roomId")), 10);
  const checkIn = new Date(cleanText(form.get("checkIn")));
  const checkOut = new Date(cleanText(form.get("checkOut")));

  if (
    !Number.isFinite(guestId) ||
    !Number.isFinite(roomId) ||
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime()) ||
    checkOut <= checkIn
  ) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "بيانات الحجز غير صحيحة", "Invalid reservation data"))}`,
        request.url,
      ),
    );
  }

  const roomReady = await query(`SELECT 1 FROM rooms WHERE id = $1 AND status = 'active'`, [
    roomId,
  ]);

  if (!roomReady.rowCount) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "الغرفة غير نشطة", "Room is not active"))}`,
        request.url,
      ),
    );
  }

  const overlap = await query(
    `
    SELECT 1
    FROM reservations
    WHERE room_id = $1
      AND reservation_status IN ('booked', 'checked_in')
      AND tstzrange(check_in, check_out, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
    LIMIT 1
    `,
    [roomId, checkIn.toISOString(), checkOut.toISOString()],
  );

  if (overlap.rowCount) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "الغرفة محجوزة في هذا الوقت", "Room is already booked for this time"))}`,
        request.url,
      ),
    );
  }

  await query(
    `
    INSERT INTO reservations (guest_id, room_id, check_in, check_out, reservation_status, created_by)
    VALUES ($1, $2, $3, $4, 'checked_in', $5)
    `,
    [guestId, roomId, checkIn.toISOString(), checkOut.toISOString(), currentUser.id],
  );

  return NextResponse.redirect(
    new URL(
      `${returnTo}?ok=${encodeURIComponent(tr(lang, "تم إنشاء الحجز", "Reservation created"))}`,
      request.url,
    ),
  );
}
