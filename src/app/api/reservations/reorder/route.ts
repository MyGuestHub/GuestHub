import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { tx } from "@/lib/db";
import { revokeGuestSessionsByReservation } from "@/lib/data";
import { tr } from "@/lib/i18n";

type ReservationStatus = "booked" | "checked_in" | "checked_out" | "cancelled";

type ReservationUpdate = {
  id: number;
  reservation_status: ReservationStatus;
  sort_order: number;
};

type Payload = {
  items: Array<{
    id: unknown;
    reservation_status: unknown;
    sort_order: unknown;
  }>;
};

const validStatuses = new Set<ReservationStatus>(["booked", "checked_in", "checked_out", "cancelled"]);

function toInt(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) : Number.NaN;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const lang = (request.headers.get("accept-language") ?? "").toLowerCase().includes("en")
    ? "en"
    : "ar";

  if (!user || !hasPermission(user, "guests.manage")) {
    return NextResponse.json(
      { ok: false, message: tr(lang, "لا تملك صلاحية", "Access denied") },
      { status: 403 },
    );
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, message: tr(lang, "البيانات غير صالحة", "Invalid payload") },
      { status: 400 },
    );
  }

  if (!Array.isArray(payload.items)) {
    return NextResponse.json(
      { ok: false, message: tr(lang, "البيانات غير صالحة", "Invalid payload") },
      { status: 400 },
    );
  }

  const updates: ReservationUpdate[] = [];
  for (const item of payload.items) {
    const id = toInt(item.id);
    const sortOrder = toInt(item.sort_order);
    const status = item.reservation_status;

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: tr(lang, "معرف الحجز غير صالح", "Invalid reservation id") },
        { status: 400 },
      );
    }
    if (typeof status !== "string" || !validStatuses.has(status as ReservationStatus)) {
      return NextResponse.json(
        { ok: false, message: tr(lang, "الحالة غير صالحة", "Invalid reservation status") },
        { status: 400 },
      );
    }
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      return NextResponse.json(
        { ok: false, message: tr(lang, "ترتيب غير صالح", "Invalid sort order") },
        { status: 400 },
      );
    }

    updates.push({
      id,
      reservation_status: status as ReservationStatus,
      sort_order: sortOrder,
    });
  }

  await tx(async (client) => {
    for (const item of updates) {
      const result = await client.query(
        `
        UPDATE reservations
        SET reservation_status = $2, sort_order = $3
        WHERE id = $1
        `,
        [item.id, item.reservation_status, item.sort_order],
      );
      if (!result.rowCount) {
        throw new Error(`Reservation not found: ${item.id}`);
      }
    }
  });

  // Revoke guest sessions for reservations that are no longer active
  const deactivated = updates.filter(
    (u) => u.reservation_status === "checked_out" || u.reservation_status === "cancelled",
  );
  for (const item of deactivated) {
    await revokeGuestSessionsByReservation(item.id);
  }

  return NextResponse.json({
    ok: true,
    message: tr(lang, "تم تحديث الحجوزات", "Reservations updated"),
  });
}
