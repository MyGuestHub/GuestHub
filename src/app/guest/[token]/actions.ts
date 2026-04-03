"use server";

import { cookies } from "next/headers";
import {
  createGuestSession,
  isRoomQrToken,
  validateRoomQrToken,
} from "@/lib/data";

const COOKIE_NAME = "guest_session";

export async function activateGuestSession(token: string): Promise<boolean> {
  const isRoom = await isRoomQrToken(token);
  if (!isRoom) return false;

  const guest = await validateRoomQrToken(token);
  if (!guest) return false;

  const sessionToken = await createGuestSession(
    guest.reservationId,
    token,
    guest.checkOut,
  );

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/guest",
    maxAge: 60 * 60 * 24 * 90, // 90 days max; actual expiry checked in DB
  });

  return true;
}
