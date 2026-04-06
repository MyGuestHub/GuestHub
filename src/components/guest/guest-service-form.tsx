"use client";

import { useEffect, useState } from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCoffee,
  FiDroplet,
  FiFileText,
  FiHeart,
  FiHome,
  FiMessageSquare,
  FiMonitor,
  FiNavigation,
  FiPackage,
  FiSettings,
  FiShield,
  FiStar,
  FiTool,
} from "react-icons/fi";
import type { ServiceCategory, ServiceItem } from "@/lib/data";
import type { AppLang } from "@/lib/i18n";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FiCoffee,
  FiHome,
  FiDroplet,
  FiCalendar,
  FiTool,
  FiNavigation,
  FiHeart,
  FiFileText,
  FiBriefcase,
  FiMonitor,
  FiMessageSquare,
  FiSettings,
  FiShield,
  FiPackage,
  FiStar,
};

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  food_beverage:   { bg: "bg-orange-500/15",  text: "text-orange-400",  ring: "hover:border-orange-500/30" },
  housekeeping:    { bg: "bg-sky-500/15",     text: "text-sky-400",     ring: "hover:border-sky-500/30" },
  laundry:         { bg: "bg-violet-500/15",  text: "text-violet-400",  ring: "hover:border-violet-500/30" },
  facilities:      { bg: "bg-emerald-500/15", text: "text-emerald-400", ring: "hover:border-emerald-500/30" },
  transport:       { bg: "bg-blue-500/15",    text: "text-blue-400",    ring: "hover:border-blue-500/30" },
  wellness:        { bg: "bg-pink-500/15",    text: "text-pink-400",    ring: "hover:border-pink-500/30" },
  stay_management: { bg: "bg-indigo-500/15",  text: "text-indigo-400",  ring: "hover:border-indigo-500/30" },
  maintenance:     { bg: "bg-amber-500/15",   text: "text-amber-400",   ring: "hover:border-amber-500/30" },
  business:        { bg: "bg-slate-500/15",   text: "text-slate-300",   ring: "hover:border-slate-500/30" },
  entertainment:   { bg: "bg-purple-500/15",  text: "text-purple-400",  ring: "hover:border-purple-500/30" },
  communication:   { bg: "bg-teal-500/15",    text: "text-teal-400",    ring: "hover:border-teal-500/30" },
  room_settings:   { bg: "bg-gray-500/15",    text: "text-gray-400",    ring: "hover:border-gray-500/30" },
  safety:          { bg: "bg-red-500/15",     text: "text-red-400",     ring: "hover:border-red-500/30" },
  convenience:     { bg: "bg-cyan-500/15",    text: "text-cyan-400",    ring: "hover:border-cyan-500/30" },
  feedback:        { bg: "bg-yellow-500/15",  text: "text-yellow-400",  ring: "hover:border-yellow-500/30" },
};
const defaultColor = { bg: "bg-blue-500/15", text: "text-blue-400", ring: "hover:border-blue-500/30" };

type CategoryWithItems = ServiceCategory & { items: ServiceItem[] };

type Props = {
  token: string;
  categories: CategoryWithItems[];
  lang: AppLang;
};

export function GuestServiceForm({ token, categories, lang }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithItems | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    estimatedDurationMinutes?: number | null;
    etaType?: "food" | "transport" | "service";
    invoiceUrl?: string;
    paymentUrl?: string;
  } | null>(null);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const BackIcon = lang === "ar" ? FiChevronRight : FiChevronLeft;

  useEffect(() => {
    if (!result?.ok) return;
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("guest-requests-expand"));
      const section = document.getElementById("guest-requests-live");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, [result?.ok]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const form = new FormData(e.currentTarget);
    form.set("token", token);
    form.set("lang", lang);

    try {
      const res = await fetch("/api/guest/request", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({
          ok: true,
          message: data.message,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          etaType: data.etaType,
          invoiceUrl: data.invoiceUrl,
          paymentUrl: data.paymentUrl,
        });
        (e.target as HTMLFormElement).reset();
        setSelectedCategory(null);
        window.dispatchEvent(new CustomEvent("guest-request-change"));
      } else {
        setResult({ ok: false, message: data.error ?? t("حدث خطأ", "Something went wrong") });
      }
    } catch {
      setResult({ ok: false, message: t("خطأ في الاتصال", "Connection error") });
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.ok) {
    const etaLabel =
      result.etaType === "food"
        ? t("الوقت المتوقع لتجهيز الطلب", "Estimated food preparation time")
        : result.etaType === "transport"
          ? t("الوقت المتوقع لوصول السيارة", "Estimated taxi arrival time")
          : t("الوقت المتوقع لتنفيذ الطلب", "Estimated fulfillment time");

    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center backdrop-blur-xl">
        <FiCheck className="mx-auto mb-2 h-10 w-10 text-emerald-400" />
        <p className="text-sm font-medium text-emerald-300">{result.message}</p>
        {result.estimatedDurationMinutes ? (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200">
            <FiClock className="h-3.5 w-3.5" />
            {etaLabel}: ~{result.estimatedDurationMinutes} {t("دقيقة", "min")}
          </div>
        ) : (
          <p className="mt-3 text-xs text-emerald-200/85">
            {t(
              "سوف يتم تحديث الوقت المتوقع بمجرد قبول الطلب من قبل الفريق.",
              "ETA will appear once your request is approved by staff.",
            )}
          </p>
        )}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a
            href={result.invoiceUrl ?? "#"}
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("guest-invoice-open", { detail: { focusPayment: false } }));
            }}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {t("عرض الفاتورة", "View Invoice")}
          </a>
          <a
            href={result.paymentUrl ?? "#"}
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("guest-invoice-open", { detail: { focusPayment: true } }));
            }}
            className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
          >
            {t("تعليمات الدفع", "Payment Instructions")}
          </a>
        </div>
        <a
          href="#guest-requests-live"
          onClick={() => window.dispatchEvent(new CustomEvent("guest-requests-expand"))}
          className="mt-3 block text-xs font-medium text-cyan-300 underline decoration-cyan-400/50 underline-offset-4 hover:text-cyan-200"
        >
          {t("تتبع الطلب الآن", "Track this request now")}
        </a>
        <button
          onClick={() => setResult(null)}
          className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
        >
          {t("طلب خدمة أخرى", "Request Another Service")}
        </button>
      </div>
    );
  }

  /* ─── Category picker ──────────────────────────────────────────── */
  if (!selectedCategory) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {result && !result.ok ? (
          <p className="col-span-full rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {result.message}
          </p>
        ) : null}
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon ?? ""] ?? FiHome;
          const color = colorMap[cat.slug] ?? defaultColor;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              className={`flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-center backdrop-blur-xl transition hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20 ${color.ring}`}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${color.bg} ${color.text}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/90">
                  {lang === "ar" ? cat.name_ar : cat.name_en}
                </p>
                <p className="text-[11px] text-white/45">
                  {cat.items.length} {t("خدمة", "services")}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  /* ─── Service item selection & submission ─────────────────────── */
  return (
    <div>
      <button
        onClick={() => {
          setSelectedCategory(null);
          setResult(null);
        }}
        className="mb-3 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition"
      >
        <BackIcon className="h-4 w-4" />
        {t("رجوع للفئات", "Back to categories")}
      </button>

      <h3 className="mb-3 text-base font-semibold text-white">
        {lang === "ar" ? selectedCategory.name_ar : selectedCategory.name_en}
      </h3>

      {result && !result.ok ? (
        <p className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {result.message}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Service item */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">
            {t("اختر الخدمة", "Choose service")}
          </label>
          <div className="space-y-2">
            {selectedCategory.items.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3 backdrop-blur-xl transition has-[:checked]:border-cyan-500/40 has-[:checked]:bg-cyan-500/10"
              >
                <input
                  type="radio"
                  name="serviceItemId"
                  value={item.id}
                  required
                  className="mt-1 accent-cyan-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/90">
                    {lang === "ar" ? item.name_ar : item.name_en}
                  </p>
                  {(lang === "ar" ? item.description_ar : item.description_en) ? (
                    <p className="text-xs text-white/45">
                      {lang === "ar" ? item.description_ar : item.description_en}
                    </p>
                  ) : null}
                  {item.estimated_duration_minutes ? (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-cyan-400">
                      <FiClock className="h-3 w-3" />
                      ~{item.estimated_duration_minutes} {t("دقيقة", "min")}
                    </p>
                  ) : null}
                </div>
                {item.estimated_cost ? (
                  <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-medium text-white/70">
                    ${item.estimated_cost}
                  </span>
                ) : (
                  <span className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-400">
                    {t("مجاني", "Free")}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">
            {t("الكمية", "Quantity")}
          </label>
          <input
            type="number"
            name="quantity"
            defaultValue={1}
            min={1}
            max={10}
            className="w-24 rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white/90 backdrop-blur-xl"
          />
        </div>

        {/* Scheduled time (optional) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">
            {t("وقت التوصيل المفضل (اختياري)", "Preferred time (optional)")}
          </label>
          <input
            type="datetime-local"
            name="scheduledAt"
            className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white/90 backdrop-blur-xl"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">
            {t("ملاحظات إضافية", "Additional notes")}
          </label>
          <textarea
            name="notes"
            rows={2}
            maxLength={500}
            placeholder={t("مثال: بدون ملح، حار جداً", "e.g. no salt, extra spicy")}
            className="w-full resize-none rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 backdrop-blur-xl"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30 disabled:opacity-50"
        >
          {submitting
            ? t("جارٍ الإرسال…", "Submitting…")
            : t("إرسال الطلب", "Submit Request")}
        </button>
      </form>
    </div>
  );
}
