import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "services.manage")) {
    return NextResponse.json({ count: 0, requests: [] });
  }

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since") ?? new Date(Date.now() - 30_000).toISOString();

  const result = await query<{
    id: number;
    guest_name: string;
    room_number: string;
    item_name_en: string;
    item_name_ar: string;
    request_status: string;
    created_at: string;
  }>(
    `SELECT
       sr.id,
       g.first_name || ' ' || g.last_name AS guest_name,
       rm.room_number,
       si.name_en AS item_name_en,
       si.name_ar AS item_name_ar,
       sr.request_status,
       sr.created_at::text
     FROM service_requests sr
     JOIN guests g ON g.id = sr.guest_id
     JOIN rooms rm ON rm.id = sr.room_id
     JOIN service_items si ON si.id = sr.service_item_id
     WHERE sr.created_at > $1::timestamptz
       AND sr.request_status = 'pending'
     ORDER BY sr.created_at DESC
     LIMIT 20`,
    [since],
  );

  const pending = await query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM service_requests WHERE request_status = 'pending'`,
  );

  return NextResponse.json({
    count: Number(pending.rows[0]?.cnt ?? "0"),
    requests: result.rows,
  });
}
