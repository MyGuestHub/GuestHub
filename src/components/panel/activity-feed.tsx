"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiActivity,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiFilter,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiXCircle,
} from "react-icons/fi";

type AppLang = "ar" | "en";

type ActivityEvent = {
  id: string;
  event_type: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  room_number: string | null;
  created_at: string;
};

type Props = {
  lang: AppLang;
  initialEvents: ActivityEvent[];
};

const eventConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; labelAr: string; labelEn: string }
> = {
  new_request: { icon: FiBell, color: "text-amber-400", bg: "bg-amber-500/20", labelAr: "طلب جديد", labelEn: "New Request" },
  completed: { icon: FiCheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/20", labelAr: "مكتمل", labelEn: "Completed" },
  cancelled: { icon: FiXCircle, color: "text-red-400", bg: "bg-red-500/20", labelAr: "ملغى", labelEn: "Cancelled" },
  updated: { icon: FiActivity, color: "text-blue-400", bg: "bg-blue-500/20", labelAr: "تحديث", labelEn: "Updated" },
  check_in: { icon: FiLogIn, color: "text-cyan-400", bg: "bg-cyan-500/20", labelAr: "تسجيل دخول", labelEn: "Check-in" },
  check_out: { icon: FiLogOut, color: "text-violet-400", bg: "bg-violet-500/20", labelAr: "تسجيل خروج", labelEn: "Check-out" },
  booking: { icon: FiCalendar, color: "text-indigo-400", bg: "bg-indigo-500/20", labelAr: "حجز", labelEn: "Booking" },
  reservation: { icon: FiCalendar, color: "text-slate-400", bg: "bg-slate-500/20", labelAr: "حجز", labelEn: "Reservation" },
};

const defaultEvent = { icon: FiActivity, color: "text-slate-400", bg: "bg-slate-500/20", labelAr: "حدث", labelEn: "Event" };

export function ActivityFeed({ lang, initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/activity");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch { /* ignore */ }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const filtered = filter ? events.filter((e) => e.event_type === filter) : events;

  const filterTypes = [...new Set(events.map((e) => e.event_type))];

  // Group by date
  const grouped = new Map<string, ActivityEvent[]>();
  for (const event of filtered) {
    const date = new Date(event.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const existing = grouped.get(date) ?? [];
    existing.push(event);
    grouped.set(date, existing);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/10 disabled:opacity-40"
        >
          <FiRefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {t("تحديث", "Refresh")}
        </button>

        <div className="flex items-center gap-1">
          <FiFilter className="h-3.5 w-3.5 text-white/30" />
          <button
            onClick={() => setFilter(null)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
              filter === null ? "bg-white/15 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/60"
            }`}
          >
            {t("الكل", "All")}
          </button>
          {filterTypes.map((ft) => {
            const cfg = eventConfig[ft] ?? defaultEvent;
            return (
              <button
                key={ft}
                onClick={() => setFilter(ft)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                  filter === ft ? `bg-white/15 ${cfg.color}` : "text-white/40 hover:bg-white/5 hover:text-white/60"
                }`}
              >
                {t(cfg.labelAr, cfg.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {[...grouped.entries()].map(([date, dayEvents]) => (
          <div key={date}>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/50">
                {date}
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="relative ms-5 space-y-0.5">
              {/* Vertical timeline line */}
              <div className="absolute -start-3.5 top-0 h-full w-px bg-white/10" />

              {dayEvents.map((event) => {
                const cfg = eventConfig[event.event_type] ?? defaultEvent;
                const Icon = cfg.icon;
                const time = new Date(event.created_at).toLocaleTimeString(lang === "ar" ? "ar" : "en", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={event.id} className="group relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[0.03]">
                    {/* Timeline dot */}
                    <div className={`absolute -start-5 top-3.5 grid h-4 w-4 place-items-center rounded-full ${cfg.bg}`}>
                      <div className={`h-2 w-2 rounded-full ${cfg.color.replace("text-", "bg-")}`} />
                    </div>

                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${cfg.bg}`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-white/90">
                          {lang === "ar" ? event.title_ar : event.title_en}
                        </p>
                        {event.room_number && (
                          <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/60">
                            {event.room_number}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-white/40">
                        {lang === "ar" ? event.subtitle_ar : event.subtitle_en}
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] text-white/30">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <FiActivity className="mx-auto mb-3 h-8 w-8 text-white/10" />
            <p className="text-sm text-white/30">{t("لا توجد أحداث", "No activity found")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
