import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { cleanText } from "@/lib/http";
import {
  listFacilityTypes,
  listFacilityBookings,
  cancelFacilityBooking,
} from "@/lib/data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "facilities.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const facilityId = url.searchParams.get("facilityId") ? Number(url.searchParams.get("facilityId")) : undefined;
  const date = url.searchParams.get("date") || undefined;

  const [facilities, bookings] = await Promise.all([
    listFacilityTypes(),
    listFacilityBookings(facilityId, date),
  ]);
  return NextResponse.json({ facilities, bookings });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "facilities.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const action = cleanText(form.get("action"));

  if (action === "cancel") {
    const id = Number(cleanText(form.get("id")));
    await cancelFacilityBooking(id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
