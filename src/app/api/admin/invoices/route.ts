import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { cleanText } from "@/lib/http";
import {
  listAllInvoices,
  updateInvoiceStatus,
  syncInvoiceItems,
  listInvoiceItems,
} from "@/lib/data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "billing.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const invoiceId = url.searchParams.get("invoiceId");

  if (invoiceId) {
    const items = await listInvoiceItems(Number(invoiceId));
    return NextResponse.json({ items });
  }

  const invoices = await listAllInvoices();
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "billing.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const action = cleanText(form.get("action"));
  const invoiceId = Number(cleanText(form.get("invoiceId")));

  if (action === "sync") {
    const reservationId = Number(cleanText(form.get("reservationId")));
    await syncInvoiceItems(reservationId);
    return NextResponse.json({ ok: true });
  }

  if (action === "status") {
    const status = cleanText(form.get("status"));
    if (!["open", "closed", "paid"].includes(status || ""))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    await updateInvoiceStatus(invoiceId, status!);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
