import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveLang, tr } from "@/lib/i18n";
import { validateGuestSession, listFavorites } from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = resolveLang(url.searchParams.get("lang"));
  const cookieStore = await cookies();
  const session = cookieStore.get("guest_session")?.value;
  const guest = session ? await validateGuestSession(session) : null;
  if (!guest) return NextResponse.json({ error: tr(lang, "غير مصرح", "Unauthorized") }, { status: 403 });

  const items = await listFavorites(guest.guestId);
  return NextResponse.json({ items });
}
