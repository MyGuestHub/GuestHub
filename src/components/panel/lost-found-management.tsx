"use client";

import { useCallback, useEffect, useState } from "react";
import { FiBox, FiCheck, FiPackage, FiPlus, FiSearch, FiX } from "react-icons/fi";

type LFItem = {
  id: number;
  room_number: string | null;
  item_description: string;
  location_found: string | null;
  category: string;
  status: string;
  contact_info: string | null;
  notes: string | null;
  reporter_name: string | null;
  created_at: string;
};

type Props = { lang: string };

const STATUS_COLORS: Record<string, string> = {
  reported: "bg-amber-500/20 text-amber-300",
  stored: "bg-blue-500/20 text-blue-300",
  claimed: "bg-emerald-500/20 text-emerald-300",
  disposed: "bg-slate-500/20 text-slate-400",
};

const CATEGORIES = [
  { value: "electronics", ar: "إلكترونيات", en: "Electronics", icon: "📱" },
  { value: "clothing", ar: "ملابس", en: "Clothing", icon: "👕" },
  { value: "documents", ar: "وثائق", en: "Documents", icon: "📄" },
  { value: "jewelry", ar: "مجوهرات", en: "Jewelry", icon: "💍" },
  { value: "luggage", ar: "أمتعة", en: "Luggage", icon: "🧳" },
  { value: "other", ar: "أخرى", en: "Other", icon: "📦" },
];

export function LostFoundManagement({ lang }: Props) {
  const [items, setItems] = useState<LFItem[]>([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const load = useCallback(async () => {
    const q = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/lost-found${q}`);
    if (res.ok) setItems((await res.json()).items ?? []);
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  async function updateStatus(id: number, status: string) {
    const fd = new FormData();
    fd.set("action", "status");
    fd.set("id", String(id));
    fd.set("status", status);
    await fetch("/api/admin/lost-found", { method: "POST", body: fd });
    load();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    fd.set("action", "create");
    await fetch("/api/admin/lost-found", { method: "POST", body: fd });
    setSubmitting(false);
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {["", "reported", "stored", "claimed", "disposed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === s ? "bg-white/15 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {s || t("الكل", "All")}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-lg bg-blue-600/30 px-3 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-600/50 transition"
        >
          <FiPlus className="h-3.5 w-3.5" /> {t("إضافة", "Add")}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl bg-slate-900/60 p-4 space-y-3 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">{t("الوصف", "Description")}</label>
              <input name="itemDescription" required className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400 placeholder:text-white/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">{t("الموقع", "Location Found")}</label>
              <input name="locationFound" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400 placeholder:text-white/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">{t("الفئة", "Category")}</label>
              <select name="category" className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.icon} {lang === "ar" ? c.ar : c.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">{t("رقم الغرفة", "Room ID")}</label>
              <input name="roomId" type="number" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400 placeholder:text-white/30" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">{t("ملاحظات", "Notes")}</label>
            <textarea name="notes" rows={2} className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400 placeholder:text-white/30" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {t("حفظ", "Save")}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/20">
              {t("إلغاء", "Cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Items Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <div className="col-span-full rounded-2xl bg-slate-900/50 p-10 text-center text-sm text-white/40">
            <FiBox className="mx-auto mb-2 h-8 w-8" />
            {t("لا توجد عناصر", "No items")}
          </div>
        )}
        {items.map((item) => {
          const cat = CATEGORIES.find((c) => c.value === item.category);
          return (
            <div key={item.id} className="rounded-2xl bg-slate-900/60 p-4 backdrop-blur-xl">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{cat?.icon ?? "📦"}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[item.status] ?? ""}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-sm font-medium text-white">{item.item_description}</p>
              {item.location_found && (
                <p className="mt-0.5 text-xs text-white/50">{t("الموقع:", "Location:")} {item.location_found}</p>
              )}
              {item.room_number && (
                <p className="text-xs text-white/50">{t("غرفة", "Room")} {item.room_number}</p>
              )}
              <p className="mt-1 text-[10px] text-white/30">
                {new Date(item.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}
              </p>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-1">
                {item.status === "reported" && (
                  <button onClick={() => updateStatus(item.id, "stored")}
                    className="rounded-lg bg-blue-600/20 px-2 py-1 text-[10px] font-medium text-blue-300 hover:bg-blue-600/40">
                    <FiPackage className="me-0.5 inline h-3 w-3" /> {t("تخزين", "Store")}
                  </button>
                )}
                {(item.status === "reported" || item.status === "stored") && (
                  <button onClick={() => updateStatus(item.id, "claimed")}
                    className="rounded-lg bg-emerald-600/20 px-2 py-1 text-[10px] font-medium text-emerald-300 hover:bg-emerald-600/40">
                    <FiCheck className="me-0.5 inline h-3 w-3" /> {t("تم استلامه", "Claimed")}
                  </button>
                )}
                {item.status !== "disposed" && item.status !== "claimed" && (
                  <button onClick={() => updateStatus(item.id, "disposed")}
                    className="rounded-lg bg-slate-600/20 px-2 py-1 text-[10px] font-medium text-slate-400 hover:bg-slate-600/40">
                    <FiX className="me-0.5 inline h-3 w-3" /> {t("تخلص", "Dispose")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
