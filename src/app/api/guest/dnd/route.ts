import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveLang, tr } from "@/lib/i18n";
import { cleanText } from "@/lib/http";
import { validateGuestSession, setDnd, getDnd } from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = resolveLang(url.searchParams.get("lang"));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const active = await getDnd(guest.reservationId);
  return NextResponse.json({ dnd: active });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const active = cleanText(form.get("active")) === "true";
  await setDnd(guest.reservationId, active);
  return NextResponse.json({
    ok: true,
    dnd: active,
    message: active
      ? tr(lang, "تم تفعيل عدم الإزعاج", "Do Not Disturb is ON")
      : tr(lang, "تم إلغاء عدم الإزعاج", "Do Not Disturb is OFF"),
  });
}
