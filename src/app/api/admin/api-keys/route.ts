import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { resolveLang, tr } from "@/lib/i18n";
import { cleanText, getBaseUrl, redirectWithMessage } from "@/lib/http";
import {
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  updateApiKey,
  listApiKeys,
} from "@/lib/data";
import { generateApiKey, hashApiKey } from "@/lib/api-auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const returnTo = cleanText(form.get("returnTo")) || `/${lang}/api-keys`;
  const action = cleanText(form.get("action")) || "create";

  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "api.manage")) {
    const url = new URL(`/${lang}/dashboard`, getBaseUrl());
    return redirectWithMessage(url, "error", tr(lang, "لا تملك صلاحية", "Access denied"));
  }

  const url = new URL(returnTo, getBaseUrl());

  if (action === "create") {
    const label = cleanText(form.get("label"));
    if (!label) return redirectWithMessage(url, "error", tr(lang, "الاسم مطلوب", "Label is required"));

    const scopesRaw = cleanText(form.get("scopes"));
    const scopes = scopesRaw ? scopesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (scopes.length === 0) return redirectWithMessage(url, "error", tr(lang, "يجب اختيار صلاحية واحدة على الأقل", "Select at least one scope"));

    const rateLimit = Math.max(1, Math.min(1000, Number(cleanText(form.get("rateLimit"))) || 60));
    const expiresAt = cleanText(form.get("expiresAt")) || null;

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    await createApiKey(label, keyHash, keyPrefix, scopes, rateLimit, expiresAt, currentUser.id);

    // Return the raw key ONCE — redirect with it so the UI shows it
    url.searchParams.set("newKey", rawKey);
    url.searchParams.set("ok", tr(lang, "تم إنشاء المفتاح بنجاح", "API key created successfully"));
    return NextResponse.redirect(url);
  }

  if (action === "revoke") {
    const id = Number(cleanText(form.get("id")));
    if (!id) return redirectWithMessage(url, "error", "Invalid ID");
    await revokeApiKey(id);
    return redirectWithMessage(url, "ok", tr(lang, "تم إلغاء المفتاح", "API key revoked"));
  }

  if (action === "delete") {
    const id = Number(cleanText(form.get("id")));
    if (!id) return redirectWithMessage(url, "error", "Invalid ID");
    await deleteApiKey(id);
    return redirectWithMessage(url, "ok", tr(lang, "تم حذف المفتاح", "API key deleted"));
  }

  if (action === "update") {
    const id = Number(cleanText(form.get("id")));
    const label = cleanText(form.get("label"));
    if (!id || !label) return redirectWithMessage(url, "error", "Invalid data");

    const scopesRaw = cleanText(form.get("scopes"));
    const scopes = scopesRaw ? scopesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const rateLimit = Math.max(1, Math.min(1000, Number(cleanText(form.get("rateLimit"))) || 60));
    const expiresAt = cleanText(form.get("expiresAt")) || null;

    await updateApiKey(id, label, scopes, rateLimit, expiresAt);
    return redirectWithMessage(url, "ok", tr(lang, "تم تحديث المفتاح", "API key updated"));
  }

  return redirectWithMessage(url, "error", "Unknown action");
}
