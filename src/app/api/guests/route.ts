import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { query } from "@/lib/db";
import { cleanText } from "@/lib/http";
import { resolveLang, tr } from "@/lib/i18n";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const returnTo = cleanText(form.get("returnTo")) || `/${lang}/guests`;
  const action = cleanText(form.get("action")) || "create";

  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "guests.manage")) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "لا تملك صلاحية", "Access denied"))}`,
        request.url,
      ),
    );
  }

  if (action === "delete") {
    const guestId = Number.parseInt(cleanText(form.get("guestId")), 10);
    if (!Number.isFinite(guestId)) {
      return NextResponse.redirect(
        new URL(
          `${returnTo}?error=${encodeURIComponent(tr(lang, "معرف الضيف غير صالح", "Invalid guest id"))}`,
          request.url,
        ),
      );
    }

    const hasReservations = await query(`SELECT 1 FROM reservations WHERE guest_id = $1 LIMIT 1`, [guestId]);
    if (hasReservations.rowCount) {
      return NextResponse.redirect(
        new URL(
          `${returnTo}?error=${encodeURIComponent(tr(lang, "لا يمكن حذف الضيف لوجود حجوزات مرتبطة", "Cannot delete guest with linked reservations"))}`,
          request.url,
        ),
      );
    }

    await query(`DELETE FROM guests WHERE id = $1`, [guestId]);
    return NextResponse.redirect(
      new URL(
        `${returnTo}?ok=${encodeURIComponent(tr(lang, "تم حذف الضيف", "Guest deleted"))}`,
        request.url,
      ),
    );
  }

  if (action === "update") {
    const guestId = Number.parseInt(cleanText(form.get("guestId")), 10);
    const firstName = cleanText(form.get("firstName"));
    const lastName = cleanText(form.get("lastName"));
    const phone = cleanText(form.get("phone"));
    const email = cleanText(form.get("email"));

    if (!Number.isFinite(guestId) || !firstName || !lastName) {
      return NextResponse.redirect(
        new URL(
          `${returnTo}?error=${encodeURIComponent(tr(lang, "بيانات الضيف غير صحيحة", "Invalid guest data"))}`,
          request.url,
        ),
      );
    }

    await query(
      `
      UPDATE guests
      SET first_name = $2,
          last_name = $3,
          phone = NULLIF($4, ''),
          email = NULLIF($5, '')
      WHERE id = $1
      `,
      [guestId, firstName, lastName, phone, email],
    );

    return NextResponse.redirect(
      new URL(
        `${returnTo}?ok=${encodeURIComponent(tr(lang, "تم تحديث بيانات الضيف", "Guest updated"))}`,
        request.url,
      ),
    );
  }

  const firstName = cleanText(form.get("firstName"));
  const lastName = cleanText(form.get("lastName"));
  const phone = cleanText(form.get("phone"));
  const email = cleanText(form.get("email"));

  if (!firstName || !lastName) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "الاسم الأول واسم العائلة مطلوبان", "First name and last name are required"))}`,
        request.url,
      ),
    );
  }

  await query(
    `
    INSERT INTO guests (first_name, last_name, phone, email, created_by)
    VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), $5)
    `,
    [firstName, lastName, phone, email, currentUser.id],
  );

  return NextResponse.redirect(
    new URL(
      `${returnTo}?ok=${encodeURIComponent(tr(lang, "تمت إضافة الضيف", "Guest added"))}`,
      request.url,
    ),
  );
}
