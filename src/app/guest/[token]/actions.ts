"use server";

import { cookies } from "next/headers";
import {
  createGuestSession,
  getGuestInfoByToken,
} from "@/lib/data";

const COOKIE_NAME = "guest_session";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function phonesMatch(a: string, b: string): boolean {
  const da = normalizePhone(a);
  const db = normalizePhone(b);
  if (!da || !db) return false;
  return da === db || da.endsWith(db) || db.endsWith(da);
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; error: "invalid_token" | "no_phone" | "phone_mismatch" };

export async function verifyGuestPhone(
  token: string,
  phone: string,
): Promise<VerifyResult> {
  const info = await getGuestInfoByToken(token);
  if (!info) return { ok: false, error: "invalid_token" };

  if (!info.phone) return { ok: false, error: "no_phone" };

  if (!phonesMatch(info.phone, phone)) {
    return { ok: false, error: "phone_mismatch" };
  }

  const sessionToken = await createGuestSession(
    info.reservationId,
    token,
    info.checkOut,
  );

  const cookieStore = await cookies();
  // Clear old cookies (both legacy path and current path)
  cookieStore.delete({ name: COOKIE_NAME, path: "/guest" });
  cookieStore.delete({ name: COOKIE_NAME, path: "/" });
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  return { ok: true };
}

/**
 * Migrate session cookie from old path (/guest) to root (/).
 * Called from a client component on portal load so the cookie
 * is also sent to /api/guest/* routes by the browser.
 */
export async function fixSessionCookiePath(): Promise<void> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (!existing) return;
  // Delete the old path-scoped cookie and re-set with path=/
  cookieStore.delete({ name: COOKIE_NAME, path: "/guest" });
  cookieStore.set(COOKIE_NAME, existing, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}
