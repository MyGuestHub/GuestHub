import { FiActivity, FiBell, FiCheckCircle, FiClock, FiLoader, FiTool, FiUsers } from "react-icons/fi";
import Link from "next/link";
import { PanelShell } from "@/components/panel/panel-shell";
import { RoomCarousel } from "@/components/panel/room-carousel";
import { getRoomStats, getServiceRequestStats, listRoomStatus } from "@/lib/data";
import { hasPermission } from "@/lib/auth";
import { requirePanelContext } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function DashboardPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);

  const [stats, rooms, srStats] = await Promise.all([
    getRoomStats(),
    listRoomStatus(),
    hasPermission(ctx.user, "services.manage")
      ? getServiceRequestStats()
      : Promise.resolve(null),
  ]);

  const occupancyRate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
  const availableRate = stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0;
  const maintenanceRate = stats.total > 0 ? Math.round((stats.maintenance / stats.total) * 100) : 0;
  const serviceOpen = srStats ? srStats.pending + srStats.accepted + srStats.in_progress : 0;

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="dashboard"
      title={ctx.t("لوحة متابعة الغرف", "Rooms Dashboard")}
    >
      {query.error ? (
        <p className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {query.error}
        </p>
      ) : null}
      {query.ok ? (
        <p className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {query.ok}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">{ctx.t("إجمالي الغرف", "Total Rooms")}</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            <FiActivity className="h-5 w-5 text-teal-600" />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {ctx.t("معدل الإشغال", "Occupancy")}: {occupancyRate}%
          </p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700">{ctx.t("المتاحة", "Available")}</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-emerald-700">{stats.available}</p>
            <FiCheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-xs text-emerald-600">{availableRate}%</p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-700">{ctx.t("المشغولة", "Occupied")}</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-amber-700">{stats.occupied}</p>
            <FiUsers className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-xs text-amber-600">{occupancyRate}%</p>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs text-rose-700">{ctx.t("تحت الصيانة", "Maintenance")}</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-rose-700">{stats.maintenance}</p>
            <FiTool className="h-5 w-5 text-rose-600" />
          </div>
          <p className="mt-2 text-xs text-rose-600">{maintenanceRate}%</p>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {ctx.t("مؤشرات التشغيل", "Operational Indicators")}
            </h2>
            <span className="text-xs text-slate-400">{ctx.t("اليوم", "Today")}</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>{ctx.t("الإشغال", "Occupancy")}</span>
                <span className="font-medium">{occupancyRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-amber-500 transition-all"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>{ctx.t("التوفر", "Availability")}</span>
                <span className="font-medium">{availableRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${availableRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>{ctx.t("الصيانة", "Maintenance")}</span>
                <span className="font-medium">{maintenanceRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-rose-500 transition-all"
                  style={{ width: `${maintenanceRate}%` }}
                />
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            {ctx.t("دسترسی سریع", "Quick Access")}
          </h2>
          <div className="mt-4 grid gap-2">
            <Link
              href={`/${ctx.lang}/rooms`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              {ctx.t("إدارة الغرف", "Manage Rooms")}
            </Link>
            <Link
              href={`/${ctx.lang}/reservations`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              {ctx.t("الحجوزات المباشرة", "Live Reservations")}
            </Link>
            <Link
              href={`/${ctx.lang}/service-requests`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              {ctx.t("طلبات الخدمة", "Service Requests")}
            </Link>
          </div>
        </article>
      </section>

      {srStats ? (
        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {ctx.t("طلبات الخدمة", "Service Requests")}
            </h2>
            <Link
              href={`/${ctx.lang}/service-requests`}
              className="text-xs text-teal-600 underline"
            >
              {ctx.t("عرض الكل", "View all")}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">{ctx.t("معلّقة", "Pending")}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-amber-700">{srStats.pending}</p>
                <FiClock className="h-5 w-5 text-amber-600" />
              </div>
            </article>
            <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs text-indigo-700">{ctx.t("قيد التنفيذ", "In Progress")}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-indigo-700">{srStats.in_progress}</p>
                <FiLoader className="h-5 w-5 text-indigo-600" />
              </div>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">{ctx.t("مكتملة", "Completed")}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-emerald-700">{srStats.completed}</p>
                <FiCheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </article>
            <article className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <p className="text-xs text-teal-700">{ctx.t("الإجمالي", "Total")}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-900">{srStats.total}</p>
                <FiBell className="h-5 w-5 text-teal-600" />
              </div>
              <p className="mt-2 text-xs text-teal-600">
                {ctx.t("طلبات مفتوحة", "Open tickets")}: {serviceOpen}
              </p>
            </article>
          </div>
        </section>
      ) : null}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          {ctx.t("عرض سريع للغرف", "Quick Rooms List")}
        </h2>
        <RoomCarousel
          rooms={rooms}
          labels={{
            available: ctx.t("متاحة", "Available"),
            occupied: ctx.t("مشغولة", "Occupied"),
            maintenance: ctx.t("صيانة", "Maintenance"),
            notification: ctx.t("تنبيه", "Notification"),
          }}
        />
      </section>
    </PanelShell>
  );
}
