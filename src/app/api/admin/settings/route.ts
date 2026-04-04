import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { cleanText, getBaseUrl } from "@/lib/http";
import { resolveLang, tr } from "@/lib/i18n";
import { upsertDashboardSetting } from "@/lib/data";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const returnTo = cleanText(form.get("returnTo")) || `/${lang}/dashboard`;
  const settingKey = cleanText(form.get("setting_key"));
  const settingValueRaw = cleanText(form.get("setting_value"));

  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "settings.manage")) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(tr(lang, "لا تملك صلاحية", "Access denied"))}`, getBaseUrl()),
    );
  }

  if (!settingKey || !settingValueRaw) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(tr(lang, "بيانات غير صالحة", "Invalid data"))}`, getBaseUrl()),
    );
  }

  try {
    const settingValue = JSON.parse(settingValueRaw);
    await upsertDashboardSetting(settingKey, settingValue, currentUser.id);
  } catch {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(tr(lang, "بيانات غير صالحة", "Invalid data format"))}`, getBaseUrl()),
    );
  }

  return NextResponse.redirect(
    new URL(`${returnTo}?ok=${encodeURIComponent(tr(lang, "تم حفظ الإعدادات", "Settings saved"))}`, getBaseUrl()),
  );
}
