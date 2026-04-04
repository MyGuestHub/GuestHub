import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateGuestSession, submitRating, getRatingsForReservation } from "@/lib/data";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("guest_session")?.value;
  const guest = sessionCookie ? await validateGuestSession(sessionCookie) : null;

  if (!guest) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const requestId = Number(body.requestId);
  const stars = Number(body.stars);
  const emoji = typeof body.emoji === "string" ? body.emoji : null;
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : null;
  const validEmojis = ["love", "happy", "neutral", "sad", "angry"];

  if (!Number.isFinite(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Stars must be 1-5" }, { status: 400 });
  }
  if (emoji && !validEmojis.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const rating = await submitRating(requestId, guest.reservationId, stars, emoji, comment || null);
  return NextResponse.json({ ok: true, rating });
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("guest_session")?.value;
  const guest = sessionCookie ? await validateGuestSession(sessionCookie) : null;

  if (!guest) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const ratings = await getRatingsForReservation(guest.reservationId);
  return NextResponse.json({ ratings });
}
