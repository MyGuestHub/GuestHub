import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveLang, tr } from "@/lib/i18n";
import { cleanText } from "@/lib/http";
import {
  validateGuestSession,
  listFacilityTypes,
  getAvailableSlots,
  createFacilityBooking,
  cancelFacilityBooking,
  getGuestFacilityBookings,
} from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = resolveLang(url.searchParams.get("lang"));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const facilityId = url.searchParams.get("facilityId");
  const date = url.searchParams.get("date");

  // If facilityId+date provided, return available slots
  if (facilityId && date) {
    const slots = await getAvailableSlots(Number(facilityId), date);
    return NextResponse.json({ slots });
  }

  // Return facility types + guest bookings
  const [facilities, bookings] = await Promise.all([
    listFacilityTypes(),
    getGuestFacilityBookings(guest.reservationId),
  ]);
  return NextResponse.json({ facilities, bookings });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const action = cleanText(form.get("action"));

  if (action === "cancel") {
    const id = Number(cleanText(form.get("id")));
    await cancelFacilityBooking(id);
    return NextResponse.json({ ok: true, message: tr(lang, "تم إلغاء الحجز", "Booking cancelled") });
  }

  const facilityId = Number(cleanText(form.get("facilityId")));
  const bookingDate = cleanText(form.get("bookingDate"));
  const startTime = cleanText(form.get("startTime"));
  const endTime = cleanText(form.get("endTime"));
  const guestsCount = Math.max(1, Number(cleanText(form.get("guestsCount")) || "1"));
  const notes = cleanText(form.get("notes")) || null;

  if (!facilityId || !bookingDate || !startTime || !endTime)
    return NextResponse.json({ error: tr(lang, "أكمل جميع الحقول", "Fill all fields") }, { status: 400 });

  const id = await createFacilityBooking(
    facilityId, guest.reservationId, guest.guestId,
    bookingDate, startTime, endTime, guestsCount, notes,
  );
  return NextResponse.json({
    ok: true,
    id,
    message: tr(lang, "تم الحجز بنجاح", "Booking confirmed"),
  });
}
