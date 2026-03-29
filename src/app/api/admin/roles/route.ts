import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { query } from "@/lib/db";
import { cleanText } from "@/lib/http";
import { resolveLang, tr } from "@/lib/i18n";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const returnTo = cleanText(form.get("returnTo")) || `/${lang}/roles`;

  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "roles.manage")) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "لا تملك صلاحية", "Access denied"))}`,
        request.url,
      ),
    );
  }

  const roleName = cleanText(form.get("roleName")).toLowerCase();
  const description = cleanText(form.get("description"));

  if (!roleName) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "اسم الدور مطلوب", "Role name is required"))}`,
        request.url,
      ),
    );
  }

  const created = await query<{ id: number }>(
    `
    INSERT INTO app_roles (role_name, description)
    VALUES ($1, NULLIF($2, ''))
    ON CONFLICT (role_name) DO NOTHING
    RETURNING id
    `,
    [roleName, description],
  );

  if (!created.rowCount) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?error=${encodeURIComponent(tr(lang, "الدور موجود مسبقًا", "Role already exists"))}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(
      `${returnTo}?ok=${encodeURIComponent(tr(lang, "تم إنشاء الدور", "Role created"))}`,
      request.url,
    ),
  );
}
