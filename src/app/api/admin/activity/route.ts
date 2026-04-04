import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRecentActivity } from "@/lib/data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const events = await getRecentActivity(50);
  return NextResponse.json({ events });
}
