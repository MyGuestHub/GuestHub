"use client";

import { useState } from "react";
import { FiAlertTriangle, FiCheck, FiChevronDown, FiSend } from "react-icons/fi";
import type { AppLang } from "@/lib/i18n";

type Props = { lang: AppLang };

const CATEGORIES = [
  { value: "cleanliness", ar: "النظافة", en: "Cleanliness" },
  { value: "noise", ar: "الضوضاء", en: "Noise" },
  { value: "service", ar: "الخدمة", en: "Service" },
  { value: "food", ar: "الطعام", en: "Food" },
  { value: "facilities", ar: "المرافق", en: "Facilities" },
  { value: "staff", ar: "الموظفين", en: "Staff" },
  { value: "billing", ar: "الفواتير", en: "Billing" },
  { value: "general", ar: "عام", en: "General" },
];

const SEVERITY = [
  { value: "low", ar: "منخفض", en: "Low", color: "bg-slate-100 text-slate-600" },
  { value: "medium", ar: "متوسط", en: "Medium", color: "bg-amber-100 text-amber-700" },
  { value: "high", ar: "مرتفع", en: "High", color: "bg-orange-100 text-orange-700" },
  { value: "critical", ar: "حرج", en: "Critical", color: "bg-rose-100 text-rose-700" },
];

export function GuestComplaintForm({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    fd.set("lang", lang);
    const res = await fetch("/api/guest/complaints", { method: "POST", body: fd });
    const data = await res.json();
    setSubmitting(false);
    if (data.ok) {
      setResult({ ok: true, message: data.message });
      (e.target as HTMLFormElement).reset();
    } else {
      setResult({ ok: false, message: data.error ?? t("حدث خطأ", "Something went wrong") });
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setResult(null); }}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <FiAlertTriangle className="h-4 w-4 text-rose-500" />
        {t("شكوى / ملاحظة", "Complaint")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-bold text-slate-900">
                <FiAlertTriangle className="me-2 inline h-5 w-5 text-rose-500" />
                {t("تقديم شكوى", "Submit Complaint")}
              </h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500">✕</button>
            </div>

            {result?.ok ? (
              <div className="p-6 text-center">
                <FiCheck className="mx-auto mb-2 h-10 w-10 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-800">{result.message}</p>
                <button onClick={() => setOpen(false)} className="mt-4 rounded-xl bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700">
                  {t("إغلاق", "Close")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                {result && !result.ok && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{result.message}</p>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("الفئة", "Category")}</label>
                  <select name="category" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{lang === "ar" ? c.ar : c.en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("الموضوع", "Subject")}</label>
                  <input
                    name="subject"
                    required
                    maxLength={200}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    placeholder={t("موضوع الشكوى", "Complaint subject")}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("التفاصيل", "Description")}</label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    maxLength={1000}
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    placeholder={t("اشرح المشكلة بالتفصيل", "Describe the issue in detail")}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("مستوى الأهمية", "Severity")}</label>
                  <div className="flex gap-2">
                    {SEVERITY.map((s) => (
                      <label key={s.value} className={`flex-1 cursor-pointer rounded-lg border border-transparent px-2 py-1.5 text-center text-xs font-medium transition has-[:checked]:border-current has-[:checked]:ring-1 has-[:checked]:ring-current ${s.color}`}>
                        <input type="radio" name="severity" value={s.value} className="sr-only" defaultChecked={s.value === "medium"} />
                        {lang === "ar" ? s.ar : s.en}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  <FiSend className="me-1 inline h-4 w-4" />
                  {submitting ? t("جارٍ الإرسال…", "Submitting…") : t("إرسال الشكوى", "Submit Complaint")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
