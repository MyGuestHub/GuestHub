import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateGuestSession, listServiceRequestsByReservation } from "@/lib/data";

export async function GET() {
  // All guest access requires a phone-verified session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("guest_session")?.value;
  const guest = sessionCookie ? await validateGuestSession(sessionCookie) : null;

  if (!guest) {
    return NextResponse.json({ error: "Invalid or expired access link" }, { status: 403 });
  }

  const requests = await listServiceRequestsByReservation(guest.reservationId);
  return NextResponse.json({ requests });
}
