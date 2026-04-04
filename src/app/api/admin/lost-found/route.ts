import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { cleanText } from "@/lib/http";
import {
  listLostFoundItems,
  createLostFoundItem,
  updateLostFoundStatus,
} from "@/lib/data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "lost_found.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const items = await listLostFoundItems(status);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "lost_found.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const action = cleanText(form.get("action"));

  if (action === "create") {
    const roomId = cleanText(form.get("roomId")) ? Number(cleanText(form.get("roomId"))) : null;
    const desc = (cleanText(form.get("itemDescription")) || "").trim();
    const location = cleanText(form.get("locationFound")) || null;
    const category = cleanText(form.get("category")) || "other";
    const contact = cleanText(form.get("contactInfo")) || null;
    const notes = cleanText(form.get("notes")) || null;

    if (!desc) return NextResponse.json({ error: "Description required" }, { status: 400 });

    const id = await createLostFoundItem(roomId, user.id, null, desc, location, category, contact, notes);
    return NextResponse.json({ ok: true, id });
  }

  if (action === "status") {
    const id = Number(cleanText(form.get("id")));
    const status = cleanText(form.get("status"));
    if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });
    await updateLostFoundStatus(id, status);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
