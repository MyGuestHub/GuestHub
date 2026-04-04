"use client";

import { FiBarChart2, FiClock, FiStar, FiTrendingUp, FiUser, FiUsers } from "react-icons/fi";

type AppLang = "ar" | "en";

type OccupancyPoint = { date: string; occupied: number; total: number };
type CategoryRevenue = { category_en: string; category_ar: string; total_requests: number; total_revenue: number };
type PopularItem = { item_en: string; item_ar: string; category_en: string; category_ar: string; order_count: number };
type HourlyDistribution = { hour: number; count: number };
type StaffPerformance = { staff_name: string; completed_count: number; avg_minutes: number };
type SatisfactionTrend = { date: string; avg_stars: number; count: number };

type Props = {
  lang: AppLang;
  occupancy: OccupancyPoint[];
  revenue: CategoryRevenue[];
  popular: PopularItem[];
  hourly: HourlyDistribution[];
  staff: StaffPerformance[];
  satisfaction: SatisfactionTrend[];
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-t-md" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
      <div
        className="absolute bottom-0 w-full rounded-t-md transition-all duration-700"
        style={{ height: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function AnalyticsDashboard({ lang, occupancy, revenue, popular, hourly, staff, satisfaction }: Props) {
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const maxHourly = Math.max(...hourly.map((h) => h.count), 1);
  const maxOccupancy = occupancy.length > 0 ? occupancy[0].total : 1;

  const totalRevenue = revenue.reduce((s, c) => s + c.total_revenue, 0);
  const totalRequests = revenue.reduce((s, c) => s + c.total_requests, 0);
  const avgOccupancy =
    occupancy.length > 0
      ? Math.round(
          (occupancy.reduce((s, p) => s + (p.total > 0 ? p.occupied / p.total : 0), 0) / occupancy.length) * 100,
        )
      : 0;
  const avgSatisfaction =
    satisfaction.filter((s) => s.count > 0).length > 0
      ? (
          satisfaction.filter((s) => s.count > 0).reduce((s, p) => s + p.avg_stars, 0) /
          satisfaction.filter((s) => s.count > 0).length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("متوسط الإشغال", "Avg Occupancy"), value: `${avgOccupancy}%`, icon: FiUsers, gradient: "from-cyan-500/25 to-blue-500/25", iconBg: "bg-cyan-500/20 text-cyan-300" },
          { label: t("إجمالي الطلبات", "Total Requests"), value: String(totalRequests), icon: FiBarChart2, gradient: "from-fuchsia-500/25 to-pink-500/25", iconBg: "bg-fuchsia-500/20 text-fuchsia-300" },
          { label: t("إجمالي الإيرادات", "Total Revenue"), value: `$${totalRevenue.toFixed(0)}`, icon: FiTrendingUp, gradient: "from-emerald-500/25 to-teal-500/25", iconBg: "bg-emerald-500/20 text-emerald-300" },
          { label: t("متوسط الرضا", "Avg Satisfaction"), value: avgSatisfaction, icon: FiStar, gradient: "from-amber-500/25 to-orange-500/25", iconBg: "bg-amber-500/20 text-amber-300" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl bg-gradient-to-br ${kpi.gradient} p-4 backdrop-blur-sm`}
          >
            <div className={`mb-2 grid h-10 w-10 place-items-center rounded-xl ${kpi.iconBg}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="mt-0.5 text-xs text-white/60">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Occupancy Trend */}
        <div className="gh-surface rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FiUsers className="h-4 w-4 text-cyan-400" />
            {t("معدل الإشغال (14 يوم)", "Occupancy Rate (14 Days)")}
          </h3>
          <div className="flex h-40 items-end gap-1">
            {occupancy.map((p) => {
              const pct = p.total > 0 ? (p.occupied / p.total) * 100 : 0;
              return (
                <div key={p.date} className="group relative flex-1">
                  <div className="relative h-32 overflow-hidden rounded-t-md bg-white/5">
                    <div
                      className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all duration-500"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-center text-[8px] text-white/40">
                    {new Date(p.date).getDate()}
                  </p>
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                    {pct.toFixed(0)}% — {p.occupied}/{p.total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Distribution Heatmap */}
        <div className="gh-surface rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FiClock className="h-4 w-4 text-fuchsia-400" />
            {t("الطلبات حسب الساعة", "Requests by Hour")}
          </h3>
          <div className="flex h-40 items-end gap-0.5">
            {hourly.map((h) => (
              <div key={h.hour} className="group relative flex-1">
                <div className="h-32">
                  <MiniBar value={h.count} max={maxHourly} color={`rgba(217, 70, 239, ${0.3 + (h.count / maxHourly) * 0.7})`} />
                </div>
                <p className="mt-1 text-center text-[8px] text-white/40">
                  {h.hour.toString().padStart(2, "0")}
                </p>
                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {h.count} {t("طلب", "requests")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Revenue by Category */}
        <div className="gh-surface rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FiTrendingUp className="h-4 w-4 text-emerald-400" />
            {t("الإيرادات حسب الفئة", "Revenue by Category")}
          </h3>
          <div className="space-y-2.5">
            {revenue.slice(0, 8).map((cat) => {
              const pct = totalRevenue > 0 ? (cat.total_revenue / totalRevenue) * 100 : 0;
              return (
                <div key={cat.category_en}>
                  <div className="mb-0.5 flex items-center justify-between text-xs">
                    <span className="truncate text-white/80">
                      {lang === "ar" ? cat.category_ar : cat.category_en}
                    </span>
                    <span className="text-white/50">${cat.total_revenue.toFixed(0)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Items */}
        <div className="gh-surface rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FiBarChart2 className="h-4 w-4 text-amber-400" />
            {t("الأكثر طلباً", "Most Popular")}
          </h3>
          <div className="space-y-2">
            {popular.slice(0, 8).map((item, i) => (
              <div key={item.item_en} className="flex items-center gap-2.5">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  i === 0 ? "bg-amber-500/20 text-amber-300" : i === 1 ? "bg-slate-500/20 text-slate-300" : i === 2 ? "bg-orange-500/20 text-orange-300" : "bg-white/5 text-white/40"
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-white/80">
                    {lang === "ar" ? item.item_ar : item.item_en}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {lang === "ar" ? item.category_ar : item.category_en}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">
                  {item.order_count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance */}
        <div className="gh-surface rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FiUser className="h-4 w-4 text-indigo-400" />
            {t("أداء الموظفين", "Staff Performance")}
          </h3>
          {staff.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/40">{t("لا توجد بيانات", "No data yet")}</p>
          ) : (
            <div className="space-y-3">
              {staff.slice(0, 6).map((s) => (
                <div key={s.staff_name} className="rounded-xl bg-white/5 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/80">{s.staff_name}</span>
                    <span className="text-xs text-white/50">{s.completed_count} ✓</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-white/40">
                    <FiClock className="h-3 w-3" />
                    {t("متوسط", "Avg")} {s.avg_minutes} {t("دقيقة", "min")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Satisfaction Trend */}
      <div className="gh-surface rounded-2xl p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <FiStar className="h-4 w-4 text-amber-400" />
          {t("اتجاه رضا الضيوف (14 يوم)", "Guest Satisfaction Trend (14 Days)")}
        </h3>
        <div className="relative h-32">
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map((line) => (
            <div
              key={line}
              className="absolute w-full border-t border-dashed border-white/5"
              style={{ bottom: `${(line / 5) * 100}%` }}
            >
              <span className="absolute -top-2 -start-6 text-[9px] text-white/30">{line}</span>
            </div>
          ))}
          {/* Line chart via SVG */}
          <svg className="h-full w-full" viewBox={`0 0 ${satisfaction.length * 30} 100`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="satGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(251, 191, 36, 0.3)" />
                <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
              </linearGradient>
            </defs>
            {/* Area */}
            <path
              d={`M0,100 ${satisfaction
                .map((s, i) => `L${i * 30 + 15},${100 - (s.avg_stars / 5) * 100}`)
                .join(" ")} L${(satisfaction.length - 1) * 30 + 15},100 Z`}
              fill="url(#satGradient)"
            />
            {/* Line */}
            <polyline
              points={satisfaction
                .map((s, i) => `${i * 30 + 15},${100 - (s.avg_stars / 5) * 100}`)
                .join(" ")}
              fill="none"
              stroke="rgba(251, 191, 36, 0.8)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dots */}
            {satisfaction.map((s, i) =>
              s.count > 0 ? (
                <circle
                  key={i}
                  cx={i * 30 + 15}
                  cy={100 - (s.avg_stars / 5) * 100}
                  r="3"
                  fill="#fbbf24"
                />
              ) : null,
            )}
          </svg>
        </div>
        <div className="mt-1 flex justify-between px-1">
          {satisfaction.filter((_, i) => i % 2 === 0).map((s) => (
            <span key={s.date} className="text-[8px] text-white/30">
              {new Date(s.date).getDate()}/{new Date(s.date).getMonth() + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
