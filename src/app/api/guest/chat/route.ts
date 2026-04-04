import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveLang, tr } from "@/lib/i18n";
import { cleanText } from "@/lib/http";
import {
  validateGuestSession,
  listChatMessages,
  createChatMessage,
  markChatRead,
} from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = resolveLang(url.searchParams.get("lang"));
  const markRead = url.searchParams.get("markRead") !== "0";
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const messages = await listChatMessages(guest.reservationId);
  if (markRead) {
    await markChatRead(guest.reservationId, "guest");
  }
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const text = (cleanText(form.get("message")) || "").trim();
  if (!text || text.length > 2000)
    return NextResponse.json({ error: tr(lang, "رسالة غير صالحة", "Invalid message") }, { status: 400 });

  const msg = await createChatMessage(guest.reservationId, "guest", guest.guestId, text);
  return NextResponse.json({ ok: true, message: msg });
}
