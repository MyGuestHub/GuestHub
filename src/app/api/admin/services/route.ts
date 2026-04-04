import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { query, tx } from "@/lib/db";
import { cleanText, getBaseUrl } from "@/lib/http";
import { resolveLang, tr } from "@/lib/i18n";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const action = cleanText(form.get("action"));
  const returnTo = cleanText(form.get("returnTo")) || `/${lang}/services`;

  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "services.manage")) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(tr(lang, "لا تملك صلاحية", "Access denied"))}`, getBaseUrl()),
    );
  }

  const redirect = (key: "ok" | "error", msg: string) =>
    NextResponse.redirect(new URL(`${returnTo}?${key}=${encodeURIComponent(msg)}`, getBaseUrl()));

  /* ─── Create / Update category ──────────────────────────────────── */
  if (action === "upsert_category") {
    const id = cleanText(form.get("id"));
    const slug = cleanText(form.get("slug")).toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const nameEn = cleanText(form.get("name_en"));
    const nameAr = cleanText(form.get("name_ar"));
    const icon = cleanText(form.get("icon")) || null;
    const sortOrder = Number.parseInt(cleanText(form.get("sort_order")) || "0", 10);
    const isActive = cleanText(form.get("is_active")) === "on";

    if (!slug || !nameEn || !nameAr) {
      return redirect("error", tr(lang, "جميع الحقول مطلوبة", "All fields are required"));
    }

    if (id) {
      await query(
        `UPDATE service_categories
         SET slug=$1, name_en=$2, name_ar=$3, icon=$4, sort_order=$5, is_active=$6
         WHERE id=$7`,
        [slug, nameEn, nameAr, icon, sortOrder, isActive, Number.parseInt(id, 10)],
      );
      return redirect("ok", tr(lang, "تم تحديث الفئة", "Category updated"));
    }

    await query(
      `INSERT INTO service_categories (slug, name_en, name_ar, icon, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [slug, nameEn, nameAr, icon, sortOrder, isActive],
    );
    return redirect("ok", tr(lang, "تم إنشاء الفئة", "Category created"));
  }

  /* ─── Delete category ──────────────────────────────────────────── */
  if (action === "delete_category") {
    const id = Number.parseInt(cleanText(form.get("id")), 10);
    if (!Number.isFinite(id)) {
      return redirect("error", tr(lang, "معرف غير صالح", "Invalid ID"));
    }
    await query(`DELETE FROM service_categories WHERE id = $1`, [id]);
    return redirect("ok", tr(lang, "تم حذف الفئة", "Category deleted"));
  }

  /* ─── Create / Update service item ─────────────────────────────── */
  if (action === "upsert_item") {
    const id = cleanText(form.get("id"));
    const categoryId = Number.parseInt(cleanText(form.get("category_id")), 10);
    const slug = cleanText(form.get("slug")).toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const nameEn = cleanText(form.get("name_en"));
    const nameAr = cleanText(form.get("name_ar"));
    const descEn = cleanText(form.get("description_en")) || null;
    const descAr = cleanText(form.get("description_ar")) || null;
    const costText = cleanText(form.get("estimated_cost"));
    const estimatedCost = costText ? Number.parseFloat(costText) : null;
    const durationText = cleanText(form.get("estimated_duration_minutes"));
    const estimatedDuration = durationText ? Number.parseInt(durationText, 10) : null;
    const sortOrder = Number.parseInt(cleanText(form.get("sort_order")) || "0", 10);
    const isActive = cleanText(form.get("is_active")) === "on";

    if (!slug || !nameEn || !nameAr || !Number.isFinite(categoryId)) {
      return redirect("error", tr(lang, "جميع الحقول مطلوبة", "All fields are required"));
    }

    if (id) {
      await query(
        `UPDATE service_items
         SET category_id=$1, slug=$2, name_en=$3, name_ar=$4,
             description_en=$5, description_ar=$6, estimated_cost=$7,
             estimated_duration_minutes=$8, sort_order=$9, is_active=$10
         WHERE id=$11`,
        [categoryId, slug, nameEn, nameAr, descEn, descAr, estimatedCost, estimatedDuration, sortOrder, isActive, Number.parseInt(id, 10)],
      );
      return redirect("ok", tr(lang, "تم تحديث الخدمة", "Service item updated"));
    }

    await query(
      `INSERT INTO service_items (category_id, slug, name_en, name_ar, description_en, description_ar, estimated_cost, estimated_duration_minutes, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [categoryId, slug, nameEn, nameAr, descEn, descAr, estimatedCost, estimatedDuration, sortOrder, isActive],
    );
    return redirect("ok", tr(lang, "تم إنشاء الخدمة", "Service item created"));
  }

  /* ─── Delete service item ──────────────────────────────────────── */
  if (action === "delete_item") {
    const id = Number.parseInt(cleanText(form.get("id")), 10);
    if (!Number.isFinite(id)) {
      return redirect("error", tr(lang, "معرف غير صالح", "Invalid ID"));
    }
    await query(`DELETE FROM service_items WHERE id = $1`, [id]);
    return redirect("ok", tr(lang, "تم حذف الخدمة", "Service item deleted"));
  }

  /* ─── Toggle active state ──────────────────────────────────────── */
  if (action === "toggle_active") {
    const type = cleanText(form.get("type")); // 'category' or 'item'
    const id = Number.parseInt(cleanText(form.get("id")), 10);
    if (!Number.isFinite(id)) {
      return redirect("error", tr(lang, "معرف غير صالح", "Invalid ID"));
    }
    const table = type === "category" ? "service_categories" : "service_items";
    await query(`UPDATE ${table} SET is_active = NOT is_active WHERE id = $1`, [id]);
    return redirect("ok", tr(lang, "تم تحديث الحالة", "Status updated"));
  }

  return redirect("error", tr(lang, "إجراء غير معروف", "Unknown action"));
}
