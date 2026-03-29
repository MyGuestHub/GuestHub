import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { query } from "@/lib/db";
import { cleanText } from "@/lib/http";
import { resolveLang, tr } from "@/lib/i18n";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const returnTo = cleanText(form.get("returnTo")) || `/${lang}/rooms`;

  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "rooms.manage")) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "لا تملك صلاحية", "Access denied"))}`,
        request.url,
      ),
    );
  }

  const roomNumber = cleanText(form.get("roomNumber"));
  const floorRaw = cleanText(form.get("floor"));
  const roomType = cleanText(form.get("roomType")) || "standard";
  const capacity = Number.parseInt(cleanText(form.get("capacity")) || "2", 10);
  const floor = floorRaw ? Number.parseInt(floorRaw, 10) : null;

  if (!roomNumber || !Number.isFinite(capacity) || capacity < 1) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "بيانات الغرفة غير صحيحة", "Invalid room data"))}`,
        request.url,
      ),
    );
  }

  const created = await query(
    `
    INSERT INTO rooms (room_number, floor, room_type, capacity, created_by)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (room_number) DO NOTHING
    RETURNING id
    `,
    [roomNumber, floor, roomType, capacity, currentUser.id],
  );

  if (!created.rowCount) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "رقم الغرفة مكرر", "Room number already exists"))}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(
      `${returnTo}?ok=${encodeURIComponent(tr(lang, "تمت إضافة الغرفة", "Room added"))}`,
      request.url,
    ),
  );
}
