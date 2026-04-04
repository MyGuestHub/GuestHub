"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiChevronDown, FiChevronUp, FiPackage, FiDollarSign, FiClock,
  FiGrid, FiList, FiSearch, FiX, FiCheck, FiSave, FiLayers
} from "react-icons/fi";

type Category = {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

type ServiceItem = {
  id: number;
  category_id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  estimated_cost: string | null;
  sort_order: number;
  is_active: boolean;
  estimated_duration_minutes: number | null;
  category_name_en: string;
  category_name_ar: string;
};

type Props = {
  lang: "ar" | "en";
  categories: Category[];
  items: ServiceItem[];
  basePath: string;
};

const iconList = [
  "FiCoffee", "FiHome", "FiDroplet", "FiCalendar", "FiTool",
  "FiNavigation", "FiHeart", "FiFileText", "FiBriefcase", "FiMonitor",
  "FiMessageSquare", "FiSettings", "FiShield", "FiPackage", "FiStar",
];

export function ServicesManagement({ lang, categories, items, basePath }: Props) {
  const [tab, setTab] = useState<"categories" | "items">("categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const returnTo = basePath;

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name_en.toLowerCase().includes(q) ||
      item.name_ar.includes(q) ||
      item.slug.includes(q)
    );
  });

  const itemsByCategory = categories.map((cat) => ({
    ...cat,
    items: filteredItems.filter((i) => i.category_id === cat.id),
  }));

  const handleAction = async (formData: FormData) => {
    try {
      await fetch("/api/admin/services", { method: "POST", body: formData, redirect: "manual" });
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = (type: "category" | "item", id: number) => {
    const fd = new FormData();
    fd.append("lang", lang);
    fd.append("action", "toggle_active");
    fd.append("type", type);
    fd.append("id", String(id));
    fd.append("returnTo", returnTo);
    handleAction(fd);
  };

  const deleteCategory = (id: number) => {
    if (!confirm(t("حذف هذه الفئة وجميع خدماتها؟", "Delete this category and all its services?"))) return;
    const fd = new FormData();
    fd.append("lang", lang);
    fd.append("action", "delete_category");
    fd.append("id", String(id));
    fd.append("returnTo", returnTo);
    handleAction(fd);
  };

  const deleteItem = (id: number) => {
    if (!confirm(t("حذف هذه الخدمة؟", "Delete this service?"))) return;
    const fd = new FormData();
    fd.append("lang", lang);
    fd.append("action", "delete_item");
    fd.append("id", String(id));
    fd.append("returnTo", returnTo);
    handleAction(fd);
  };

  const handleCatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("lang", lang);
    fd.append("action", "upsert_category");
    fd.append("returnTo", returnTo);
    if (editingCat) fd.append("id", String(editingCat.id));
    await handleAction(fd);
    setShowCatForm(false);
    setEditingCat(null);
  };

  const handleItemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("lang", lang);
    fd.append("action", "upsert_item");
    fd.append("returnTo", returnTo);
    if (editingItem) fd.append("id", String(editingItem.id));
    await handleAction(fd);
    setShowItemForm(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex overflow-hidden rounded-xl border border-white/20 bg-slate-900/40">
          <button
            onClick={() => setTab("categories")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition ${
              tab === "categories" ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            <FiGrid className="h-4 w-4" />
            {t("الفئات", "Categories")}
            <span className="rounded-full bg-slate-900/60 px-2 py-0.5 text-xs">{categories.length}</span>
          </button>
          <button
            onClick={() => setTab("items")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition ${
              tab === "items" ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            <FiPackage className="h-4 w-4" />
            {t("الخدمات", "Services")}
            <span className="rounded-full bg-slate-900/60 px-2 py-0.5 text-xs">{items.length}</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (tab === "categories") { setEditingCat(null); setShowCatForm(true); }
            else { setEditingItem(null); setShowItemForm(true); }
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30"
        >
          <FiPlus className="h-4 w-4" />
          {tab === "categories" ? t("فئة جديدة", "New Category") : t("خدمة جديدة", "New Service")}
        </button>
      </div>

      {/* Search for items */}
      {tab === "items" && (
        <div className="relative max-w-md">
          <FiSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("بحث في الخدمات...", "Search services...")}
            className="w-full rounded-xl border border-white/20 bg-slate-900/40 py-2.5 pe-4 ps-10 text-sm text-white placeholder-white/50 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30"
          />
        </div>
      )}

      {/* Category form modal */}
      {showCatForm && (
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {editingCat ? t("تعديل الفئة", "Edit Category") : t("فئة جديدة", "New Category")}
            </h3>
            <button onClick={() => { setShowCatForm(false); setEditingCat(null); }} className="rounded-lg p-2 text-white/60 hover:text-white">
              <FiX className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCatSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الرمز (Slug)", "Slug")}</label>
              <input name="slug" defaultValue={editingCat?.slug ?? ""} required className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الأيقونة", "Icon")}</label>
              <select name="icon" defaultValue={editingCat?.icon ?? ""} className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60">
                <option value="">{t("بدون أيقونة", "No icon")}</option>
                {iconList.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الاسم (English)", "Name (English)")}</label>
              <input name="name_en" defaultValue={editingCat?.name_en ?? ""} required className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الاسم (العربية)", "Name (Arabic)")}</label>
              <input name="name_ar" defaultValue={editingCat?.name_ar ?? ""} required className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الترتيب", "Sort Order")}</label>
              <input name="sort_order" type="number" defaultValue={editingCat?.sort_order ?? 0} className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input name="is_active" type="checkbox" defaultChecked={editingCat?.is_active ?? true} className="h-4 w-4 accent-cyan-500" />
              <label className="text-sm text-white/80">{t("فعّال", "Active")}</label>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50">
                <FiSave className="h-4 w-4" />
                {editingCat ? t("تحديث", "Update") : t("إنشاء", "Create")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Service item form modal */}
      {showItemForm && (
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {editingItem ? t("تعديل الخدمة", "Edit Service") : t("خدمة جديدة", "New Service")}
            </h3>
            <button onClick={() => { setShowItemForm(false); setEditingItem(null); }} className="rounded-lg p-2 text-white/60 hover:text-white">
              <FiX className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleItemSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الفئة", "Category")}</label>
              <select name="category_id" defaultValue={editingItem?.category_id ?? ""} required className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60">
                <option value="" disabled>{t("اختر فئة", "Select category")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{lang === "ar" ? cat.name_ar : cat.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الرمز (Slug)", "Slug")}</label>
              <input name="slug" defaultValue={editingItem?.slug ?? ""} required className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الاسم (English)", "Name (English)")}</label>
              <input name="name_en" defaultValue={editingItem?.name_en ?? ""} required className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الاسم (العربية)", "Name (Arabic)")}</label>
              <input name="name_ar" defaultValue={editingItem?.name_ar ?? ""} required className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الوصف (English)", "Description (EN)")}</label>
              <input name="description_en" defaultValue={editingItem?.description_en ?? ""} className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الوصف (العربية)", "Description (AR)")}</label>
              <input name="description_ar" defaultValue={editingItem?.description_ar ?? ""} className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("التكلفة التقديرية ($)", "Estimated Cost ($)")}</label>
              <input name="estimated_cost" type="number" step="0.01" min="0" defaultValue={editingItem?.estimated_cost ?? ""} placeholder={t("فارغ = مجاني", "Empty = Free")} className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("المدة التقديرية (دقيقة)", "Estimated Duration (min)")}</label>
              <input name="estimated_duration_minutes" type="number" min="1" defaultValue={editingItem?.estimated_duration_minutes ?? ""} placeholder={t("مثال: 30", "e.g. 30")} className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">{t("الترتيب", "Sort Order")}</label>
              <input name="sort_order" type="number" defaultValue={editingItem?.sort_order ?? 0} className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input name="is_active" type="checkbox" defaultChecked={editingItem?.is_active ?? true} className="h-4 w-4 accent-cyan-500" />
              <label className="text-sm text-white/80">{t("فعّال", "Active")}</label>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50">
                <FiSave className="h-4 w-4" />
                {editingItem ? t("تحديث", "Update") : t("إنشاء", "Create")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories tab */}
      {tab === "categories" && !showCatForm && (
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.06] shadow-2xl backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/15 bg-slate-900/40">
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-white/70">#</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("الرمز", "Slug")}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("الاسم (EN)", "Name (EN)")}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("الاسم (AR)", "Name (AR)")}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("الأيقونة", "Icon")}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70">{t("الترتيب", "Order")}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70">{t("الحالة", "Status")}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70">{t("الخدمات", "Items")}</th>
                <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wider text-white/70">{t("إجراءات", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {categories.map((cat) => {
                const catItemCount = items.filter((i) => i.category_id === cat.id).length;
                return (
                  <tr key={cat.id} className="transition-colors hover:bg-white/[0.08]">
                    <td className="px-4 py-3 font-mono text-xs text-white/60">{cat.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-cyan-300">{cat.slug}</td>
                    <td className="px-4 py-3 text-white">{cat.name_en}</td>
                    <td className="px-4 py-3 text-white">{cat.name_ar}</td>
                    <td className="px-4 py-3 text-xs text-white/60">{cat.icon || "—"}</td>
                    <td className="px-4 py-3 text-center text-white/80">{cat.sort_order}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleActive("category", cat.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                          cat.is_active
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-slate-500/20 text-slate-400 hover:bg-slate-500/30"
                        }`}
                      >
                        {cat.is_active ? <FiToggleRight className="h-3.5 w-3.5" /> : <FiToggleLeft className="h-3.5 w-3.5" />}
                        {cat.is_active ? t("فعّال", "Active") : t("معطّل", "Inactive")}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-slate-900/60 px-2 py-0.5 text-xs font-bold text-white">{catItemCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditingCat(cat); setShowCatForm(true); }}
                          className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-cyan-300"
                          title={t("تعديل", "Edit")}
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCategory(cat.id)}
                          className="rounded-lg p-2 text-white/60 transition hover:bg-rose-500/20 hover:text-rose-300"
                          title={t("حذف", "Delete")}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Items tab - grouped by category */}
      {tab === "items" && !showItemForm && (
        <div className="space-y-4">
          {itemsByCategory.map((cat) => (
            <div key={cat.id} className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.08] to-white/[0.04] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                    <FiLayers className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div className="text-start">
                    <p className="font-semibold text-white">{lang === "ar" ? cat.name_ar : cat.name_en}</p>
                    <p className="text-xs text-white/50">{cat.items.length} {t("خدمة", "services")}</p>
                  </div>
                  {!cat.is_active && (
                    <span className="rounded-full bg-slate-500/30 px-2 py-0.5 text-[10px] text-slate-400">{t("معطّل", "Inactive")}</span>
                  )}
                </div>
                {expandedCat === cat.id ? <FiChevronUp className="h-5 w-5 text-white/60" /> : <FiChevronDown className="h-5 w-5 text-white/60" />}
              </button>
              {expandedCat === cat.id && (
                <div className="border-t border-white/10">
                  {cat.items.length === 0 ? (
                    <p className="px-5 py-6 text-center text-sm text-white/50">{t("لا توجد خدمات", "No services")}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-slate-900/30">
                          <th className="px-4 py-2 text-start text-xs font-medium text-white/60">{t("الخدمة", "Service")}</th>
                          <th className="px-4 py-2 text-start text-xs font-medium text-white/60">{t("الوصف", "Description")}</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-white/60">{t("السعر", "Price")}</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-white/60">{t("المدة", "Duration")}</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-white/60">{t("الحالة", "Status")}</th>
                          <th className="px-4 py-2 text-end text-xs font-medium text-white/60">{t("إجراءات", "Actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {cat.items.map((item) => (
                          <tr key={item.id} className="transition-colors hover:bg-white/[0.05]">
                            <td className="px-4 py-3">
                              <p className="font-medium text-white">{lang === "ar" ? item.name_ar : item.name_en}</p>
                              <p className="font-mono text-[10px] text-white/40">{item.slug}</p>
                            </td>
                            <td className="max-w-[200px] px-4 py-3">
                              <p className="truncate text-xs text-white/60">{lang === "ar" ? item.description_ar : item.description_en || "—"}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.estimated_cost ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-200">
                                  <FiDollarSign className="h-3 w-3" />{item.estimated_cost}
                                </span>
                              ) : (
                                <span className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300">{t("مجاني", "Free")}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.estimated_duration_minutes ? (
                                <span className="inline-flex items-center gap-1 text-xs text-white/70">
                                  <FiClock className="h-3 w-3" />{item.estimated_duration_minutes}{t("د", "m")}
                                </span>
                              ) : <span className="text-xs text-white/40">—</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleActive("item", item.id)}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
                                  item.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-400"
                                }`}
                              >
                                {item.is_active ? t("فعّال", "Active") : t("معطّل", "Off")}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => { setEditingItem(item); setShowItemForm(true); }}
                                  className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-cyan-300"
                                >
                                  <FiEdit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteItem(item.id)}
                                  className="rounded-lg p-1.5 text-white/60 transition hover:bg-rose-500/20 hover:text-rose-300"
                                >
                                  <FiTrash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
