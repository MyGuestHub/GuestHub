import { NextResponse } from "next/server";
import { validateGuestToken, listServiceRequestsByReservation } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";

  const guest = await validateGuestToken(token);
  if (!guest) {
    return NextResponse.json({ error: "Invalid or expired access link" }, { status: 403 });
  }

  const requests = await listServiceRequestsByReservation(guest.reservationId);
  return NextResponse.json({ requests });
}
