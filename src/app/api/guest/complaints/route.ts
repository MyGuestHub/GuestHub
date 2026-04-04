import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveLang, tr } from "@/lib/i18n";
import { cleanText } from "@/lib/http";
import { validateGuestSession, createComplaint } from "@/lib/data";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const category = cleanText(form.get("category")) || "general";
  const subject = (cleanText(form.get("subject")) || "").trim();
  const description = (cleanText(form.get("description")) || "").trim();
  const severity = cleanText(form.get("severity")) || "medium";

  if (!subject || !description)
    return NextResponse.json({ error: tr(lang, "أكمل جميع الحقول", "Please fill all fields") }, { status: 400 });

  const id = await createComplaint(
    guest.reservationId, guest.guestId, guest.roomId,
    category, subject, description, severity,
  );
  return NextResponse.json({
    ok: true,
    id,
    message: tr(lang, "تم إرسال الشكوى بنجاح", "Complaint submitted successfully"),
  });
}
