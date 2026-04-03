import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isRoomQrToken, validateGuestSession, validateGuestToken, listServiceRequestsByReservation } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";

  // For room QR tokens, validate via session cookie
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
    return NextResponse.json({ error: "Invalid or expired access link" }, { status: 403 });
  }

  const requests = await listServiceRequestsByReservation(guest.reservationId);
  return NextResponse.json({ requests });
}
