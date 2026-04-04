import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listRequestLogs } from "@/lib/data";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "services.manage")) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestId = Number.parseInt(searchParams.get("requestId") ?? "", 10);
  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  const logs = await listRequestLogs(requestId);
  return NextResponse.json({ logs });
}
