"use client";

import { useMemo, useState } from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiCoffee,
  FiDroplet,
  FiFileText,
  FiHeart,
  FiHome,
  FiMessageSquare,
  FiMonitor,
  FiNavigation,
  FiPackage,
  FiPlus,
  FiSettings,
  FiShield,
  FiStar,
  FiTool,
} from "react-icons/fi";
import type { ActiveReservationOption, ServiceItemOption } from "@/lib/data";
import { AppSelect } from "@/components/ui/app-select";
import { AppModal } from "@/components/ui/app-modal";

type Props = {
  lang: "ar" | "en";
  reservations: ActiveReservationOption[];
  serviceItems: ServiceItemOption[];
  returnTo: string;
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  food_beverage: FiCoffee,
  housekeeping: FiHome,
  laundry: FiDroplet,
  facilities: FiCalendar,
  transport: FiNavigation,
  wellness: FiHeart,
  stay_management: FiFileText,
  maintenance: FiTool,
  business: FiBriefcase,
  entertainment: FiMonitor,
  communication: FiMessageSquare,
  room_settings: FiSettings,
  safety: FiShield,
  convenience: FiPackage,
  feedback: FiStar,
};

/* Glass-safe colors using explicit rgba — won't be overridden by .panel-glass */
const categoryColors: Record<string, { iconBg: string; iconText: string; border: string; cardBg: string }> = {
  food_beverage:   { iconBg: "bg-[rgba(251,146,60,0.20)]",  iconText: "text-orange-300",  border: "border-orange-400/25",  cardBg: "bg-[rgba(251,146,60,0.08)]" },
  housekeeping:    { iconBg: "bg-[rgba(56,189,248,0.20)]",   iconText: "text-sky-300",     border: "border-sky-400/25",     cardBg: "bg-[rgba(56,189,248,0.08)]" },
  laundry:         { iconBg: "bg-[rgba(167,139,250,0.20)]",  iconText: "text-violet-300",  border: "border-violet-400/25",  cardBg: "bg-[rgba(167,139,250,0.08)]" },
  facilities:      { iconBg: "bg-[rgba(52,211,153,0.20)]",   iconText: "text-emerald-300", border: "border-emerald-400/25", cardBg: "bg-[rgba(52,211,153,0.08)]" },
  transport:       { iconBg: "bg-[rgba(96,165,250,0.20)]",   iconText: "text-blue-300",    border: "border-blue-400/25",    cardBg: "bg-[rgba(96,165,250,0.08)]" },
  wellness:        { iconBg: "bg-[rgba(244,114,182,0.20)]",  iconText: "text-pink-300",    border: "border-pink-400/25",    cardBg: "bg-[rgba(244,114,182,0.08)]" },
  stay_management: { iconBg: "bg-[rgba(129,140,248,0.20)]",  iconText: "text-indigo-300",  border: "border-indigo-400/25",  cardBg: "bg-[rgba(129,140,248,0.08)]" },
  maintenance:     { iconBg: "bg-[rgba(251,191,36,0.20)]",   iconText: "text-amber-300",   border: "border-amber-400/25",   cardBg: "bg-[rgba(251,191,36,0.08)]" },
  business:        { iconBg: "bg-[rgba(148,163,184,0.20)]",  iconText: "text-slate-300",   border: "border-slate-400/25",   cardBg: "bg-[rgba(148,163,184,0.08)]" },
  entertainment:   { iconBg: "bg-[rgba(192,132,252,0.20)]",  iconText: "text-purple-300",  border: "border-purple-400/25",  cardBg: "bg-[rgba(192,132,252,0.08)]" },
  communication:   { iconBg: "bg-[rgba(45,212,191,0.20)]",   iconText: "text-teal-300",    border: "border-teal-400/25",    cardBg: "bg-[rgba(45,212,191,0.08)]" },
  room_settings:   { iconBg: "bg-[rgba(156,163,175,0.20)]",  iconText: "text-gray-300",    border: "border-gray-400/25",    cardBg: "bg-[rgba(156,163,175,0.08)]" },
  safety:          { iconBg: "bg-[rgba(248,113,113,0.20)]",  iconText: "text-red-300",     border: "border-red-400/25",     cardBg: "bg-[rgba(248,113,113,0.08)]" },
  convenience:     { iconBg: "bg-[rgba(34,211,238,0.20)]",   iconText: "text-cyan-300",    border: "border-cyan-400/25",    cardBg: "bg-[rgba(34,211,238,0.08)]" },
  feedback:        { iconBg: "bg-[rgba(250,204,21,0.20)]",   iconText: "text-yellow-300",  border: "border-yellow-400/25",  cardBg: "bg-[rgba(250,204,21,0.08)]" },
};

const defaultColor = { iconBg: "bg-[rgba(96,165,250,0.20)]", iconText: "text-blue-300", border: "border-blue-400/25", cardBg: "bg-[rgba(96,165,250,0.08)]" };

type CategoryGroup = {
  slug: string;
  nameEn: string;
  nameAr: string;
  items: ServiceItemOption[];
};

export function CreateRequestForm({ lang, reservations, serviceItems, returnTo }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const categories = useMemo(() => {
    const map = new Map<string, CategoryGroup>();
    for (const item of serviceItems) {
      let group = map.get(item.category_slug);
      if (!group) {
        group = {
          slug: item.category_slug,
          nameEn: item.category_name_en,
          nameAr: item.category_name_ar,
          items: [],
        };
        map.set(item.category_slug, group);
      }
      group.items.push(item);
    }
    return [...map.values()];
  }, [serviceItems]);

  const activeCat = selectedSlug ? categories.find((c) => c.slug === selectedSlug) : null;
  const activeItem = selectedItemId ? serviceItems.find((i) => i.id === selectedItemId) : null;

  function reset() {
    setSelectedSlug(null);
    setSelectedItemId(null);
    setOpen(false);
  }

  return (
    <section className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-[rgba(255,255,255,0.08)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.12]"
      >
        <FiPlus className="h-4 w-4" />
        {t("إنشاء طلب جديد", "Create New Request")}
      </button>

      <AppModal
        open={open}
        onClose={reset}
        title={t("إنشاء طلب جديد", "Create New Request")}
        closeLabel={t("إلغاء", "Cancel")}
        maxWidthClass="max-w-4xl"
      >
        {/* ── Step 1: Category grid ── */}
        {!selectedSlug && (
          <div className="mt-3">
            <p className="mb-4 text-sm text-white/50">
              {t("اختر فئة الخدمة", "Select a service category")}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat.slug] ?? FiPackage;
                const c = categoryColors[cat.slug] ?? defaultColor;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setSelectedSlug(cat.slug)}
                    className={`group flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center backdrop-blur-sm transition hover:bg-white/[0.06] ${c.border} ${c.cardBg}`}
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.iconBg}`}>
                      <Icon className={`h-5 w-5 ${c.iconText}`} />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold leading-tight text-white/90">
                        {lang === "ar" ? cat.nameAr : cat.nameEn}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/40">
                        {cat.items.length} {t("خدمة", "services")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Service items ── */}
        {selectedSlug && !selectedItemId && activeCat && (() => {
          const c = categoryColors[activeCat.slug] ?? defaultColor;
          const Icon = categoryIcons[activeCat.slug] ?? FiPackage;
          return (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setSelectedSlug(null)}
                className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
              >
                <FiChevronLeft className="h-3.5 w-3.5" />
                {t("رجوع للفئات", "Back to categories")}
              </button>

              <div className="mb-4 flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg}`}>
                  <Icon className={`h-5 w-5 ${c.iconText}`} />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {lang === "ar" ? activeCat.nameAr : activeCat.nameEn}
                  </h3>
                  <p className="text-xs text-white/40">
                    {t("اختر خدمة", "Select a service")}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {activeCat.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-start transition hover:bg-white/[0.06] ${c.border} bg-[rgba(255,255,255,0.05)]`}
                  >
                    <span className="text-sm font-medium text-white/85">
                      {lang === "ar" ? item.name_ar : item.name_en}
                    </span>
                    {item.estimated_cost ? (
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.iconBg} ${c.iconText}`}>
                        ${item.estimated_cost}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Step 3: Details form ── */}
        {selectedItemId && activeItem && (() => {
          const c = categoryColors[activeItem.category_slug] ?? defaultColor;
          const Icon = categoryIcons[activeItem.category_slug] ?? FiPackage;
          return (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setSelectedItemId(null)}
                className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
              >
                <FiChevronLeft className="h-3.5 w-3.5" />
                {t("رجوع للخدمات", "Back to services")}
              </button>

              <div className={`mb-5 flex items-center gap-3 rounded-xl border p-3 ${c.border} ${c.cardBg}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
                  <Icon className={`h-5 w-5 ${c.iconText}`} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {lang === "ar" ? activeItem.name_ar : activeItem.name_en}
                  </p>
                  <p className="text-xs text-white/50">
                    {lang === "ar" ? activeItem.category_name_ar : activeItem.category_name_en}
                    {activeItem.estimated_cost ? ` · $${activeItem.estimated_cost}` : ""}
                  </p>
                </div>
                <FiCheck className={`ml-auto h-5 w-5 shrink-0 ${c.iconText}`} />
              </div>

              <form
                action="/api/service-requests"
                method="post"
                className="grid gap-4 sm:grid-cols-2"
              >
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="action" value="create" />
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="serviceItemId" value={selectedItemId} />

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    {t("الحجز (الضيف / الغرفة)", "Reservation (Guest / Room)")}
                  </label>
                  <AppSelect name="reservationId" required className="w-full">
                    <option value="">{t("اختر حجزاً", "Select a reservation")}</option>
                    {reservations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.guest_name} — {t("الغرفة", "Room")} {r.room_number}
                      </option>
                    ))}
                  </AppSelect>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    {t("الكمية", "Quantity")}
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min={1}
                    max={50}
                    defaultValue={1}
                    className="w-full rounded-xl border border-white/15 bg-[rgba(255,255,255,0.08)] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    {t("الوقت المجدول (اختياري)", "Scheduled Time (optional)")}
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    className="w-full rounded-xl border border-white/15 bg-[rgba(255,255,255,0.08)] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    {t("ملاحظات (اختياري)", "Notes (optional)")}
                  </label>
                  <input
                    type="text"
                    name="notes"
                    maxLength={500}
                    className="w-full rounded-xl border border-white/15 bg-[rgba(255,255,255,0.08)] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
                    placeholder={t("ملاحظة إضافية...", "Additional note...")}
                  />
                </div>

                <div className="flex justify-end pt-2 sm:col-span-2">
                  <button className="rounded-xl bg-emerald-500/80 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
                    {t("إنشاء الطلب", "Create Request")}
                  </button>
                </div>
              </form>
            </div>
          );
        })()}
      </AppModal>
    </section>
  );
}
