import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { cleanText } from "@/lib/http";
import {
  listComplaints,
  updateComplaintStatus,
  assignComplaint,
} from "@/lib/data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "complaints.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const complaints = await listComplaints(status);
  return NextResponse.json({ complaints });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "complaints.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const action = cleanText(form.get("action"));
  const id = Number(cleanText(form.get("id")));

  if (action === "status") {
    const status = cleanText(form.get("status"));
    const resolution = cleanText(form.get("resolution")) || undefined;
    if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });
    await updateComplaintStatus(id, status, resolution);
    return NextResponse.json({ ok: true });
  }

  if (action === "assign") {
    const staffId = Number(cleanText(form.get("staffId")));
    await assignComplaint(id, staffId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
