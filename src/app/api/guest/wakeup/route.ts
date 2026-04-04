import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveLang, tr } from "@/lib/i18n";
import { cleanText } from "@/lib/http";
import {
  validateGuestSession,
  createWakeUpCall,
  getActiveWakeUp,
  cancelWakeUp,
} from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = resolveLang(url.searchParams.get("lang"));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const wakeUp = await getActiveWakeUp(guest.reservationId);
  return NextResponse.json({ wakeUp });
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
    await cancelWakeUp(id);
    return NextResponse.json({ ok: true, message: tr(lang, "تم إلغاء المنبه", "Wake-up cancelled") });
  }

  const wakeTime = cleanText(form.get("wakeTime"));
  const wakeDate = cleanText(form.get("wakeDate"));
  if (!wakeTime || !wakeDate)
    return NextResponse.json({ error: tr(lang, "حدد الوقت والتاريخ", "Specify time and date") }, { status: 400 });

  const id = await createWakeUpCall(guest.reservationId, guest.roomId, wakeTime, wakeDate);
  return NextResponse.json({
    ok: true,
    id,
    message: tr(lang, "تم ضبط المنبه بنجاح", "Wake-up call set successfully"),
  });
}
