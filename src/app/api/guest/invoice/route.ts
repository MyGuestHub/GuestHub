import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveLang, tr } from "@/lib/i18n";
import {
  validateGuestSession,
  getOrCreateInvoice,
  syncInvoiceItems,
  listInvoiceItems,
  updateInvoiceStatus,
} from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = resolveLang(url.searchParams.get("lang"));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const invoice = await getOrCreateInvoice(guest.reservationId, guest.guestId, guest.roomId);
  await syncInvoiceItems(guest.reservationId);
  const items = await listInvoiceItems(invoice.id);

  // Re-fetch invoice after sync to get updated totals
  const updated = await getOrCreateInvoice(guest.reservationId, guest.guestId, guest.roomId);
  return NextResponse.json({ invoice: updated, items });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const lang = resolveLang(url.searchParams.get("lang"));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "";
  if (action !== "pay") {
    return NextResponse.json({ error: tr(lang, "إجراء غير صالح", "Invalid action") }, { status: 400 });
  }

  const invoice = await getOrCreateInvoice(guest.reservationId, guest.guestId, guest.roomId);
  await syncInvoiceItems(guest.reservationId);
  await updateInvoiceStatus(invoice.id, "paid");
  const updated = await getOrCreateInvoice(guest.reservationId, guest.guestId, guest.roomId);
  const items = await listInvoiceItems(updated.id);

  return NextResponse.json({
    ok: true,
    message: tr(lang, "تم تسجيل الدفع بنجاح", "Payment recorded successfully"),
    invoice: updated,
    items,
  });
}
