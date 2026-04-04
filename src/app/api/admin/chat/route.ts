import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { cleanText } from "@/lib/http";
import {
  listActiveChats,
  listChatMessages,
  createChatMessage,
  markChatRead,
} from "@/lib/data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "chat.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const reservationId = url.searchParams.get("reservationId");

  if (reservationId) {
    const messages = await listChatMessages(Number(reservationId));
    await markChatRead(Number(reservationId), "staff");
    return NextResponse.json({ messages });
  }

  const chats = await listActiveChats();
  return NextResponse.json({ chats });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "chat.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const reservationId = Number(cleanText(form.get("reservationId")));
  const text = (cleanText(form.get("message")) || "").trim();

  if (!reservationId || !text)
    return NextResponse.json({ error: "Missing data" }, { status: 400 });

  const msg = await createChatMessage(reservationId, "staff", user.id, text);
  return NextResponse.json({ ok: true, message: msg });
}
