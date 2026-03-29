import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { query } from "@/lib/db";
import { cleanText } from "@/lib/http";
import { resolveLang, tr } from "@/lib/i18n";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const returnTo = cleanText(form.get("returnTo")) || `/${lang}/guests`;

  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "guests.manage")) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "لا تملك صلاحية", "Access denied"))}`,
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
