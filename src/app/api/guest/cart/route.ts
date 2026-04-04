import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cleanText } from "@/lib/http";
import { resolveLang, tr } from "@/lib/i18n";
import {
  validateGuestSession,
  listCartItems,
  addCartItem,
  removeCartItem,
  clearCart,
  checkoutCart,
} from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = resolveLang(url.searchParams.get("lang"));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const items = await listCartItems(guest.reservationId);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const action = cleanText(form.get("action"));

  if (action === "add") {
    const serviceItemId = Number(cleanText(form.get("serviceItemId")));
    const quantity = Math.max(1, Number(cleanText(form.get("quantity")) || "1"));
    const notes = cleanText(form.get("notes")) || null;
    const scheduledAt = cleanText(form.get("scheduledAt")) || null;
    if (!Number.isFinite(serviceItemId))
      return NextResponse.json({ error: tr(lang, "خدمة غير صالحة", "Invalid service") }, { status: 400 });
    const id = await addCartItem(guest.reservationId, serviceItemId, quantity, notes, scheduledAt, guest.guestId);
    return NextResponse.json({ ok: true, id });
  }

  if (action === "remove") {
    const id = Number(cleanText(form.get("id")));
    await removeCartItem(id, guest.reservationId);
    return NextResponse.json({ ok: true });
  }

  if (action === "clear") {
    await clearCart(guest.reservationId);
    return NextResponse.json({ ok: true });
  }

  if (action === "checkout") {
    const ids = await checkoutCart(guest.reservationId, guest.guestId, guest.roomId);
    return NextResponse.json({
      ok: true,
      requestIds: ids,
      message: tr(lang, "تم إرسال جميع الطلبات بنجاح", "All requests submitted successfully"),
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
