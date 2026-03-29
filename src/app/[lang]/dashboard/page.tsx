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

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="dashboard"
      title={ctx.t("لوحة متابعة الغرف", "Rooms Dashboard")}
      subtitle={ctx.t("عرض مباشر لحالة جميع الغرف", "Live room occupancy overview")}
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
          <p className="text-xs text-slate-400">{ctx.t("إجمالي الغرف", "Total Rooms")}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            <FiActivity className="h-5 w-5 text-blue-600" />
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">{ctx.t("المتاحة", "Available")}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-bold text-emerald-700">{stats.available}</p>
            <FiCheckCircle className="h-5 w-5 text-emerald-700" />
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">{ctx.t("المشغولة", "Occupied")}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-bold text-amber-700">{stats.occupied}</p>
            <FiUsers className="h-5 w-5 text-amber-700" />
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">{ctx.t("تحت الصيانة", "Maintenance")}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-bold text-rose-700">{stats.maintenance}</p>
            <FiTool className="h-5 w-5 text-rose-700" />
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
              className="text-xs text-blue-600 underline"
            >
              {ctx.t("عرض الكل", "View all")}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">{ctx.t("معلّقة", "Pending")}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-amber-700">{srStats.pending}</p>
                <FiClock className="h-5 w-5 text-amber-600" />
              </div>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">{ctx.t("قيد التنفيذ", "In Progress")}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-indigo-700">{srStats.in_progress}</p>
                <FiLoader className="h-5 w-5 text-indigo-600" />
              </div>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">{ctx.t("مكتملة", "Completed")}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-emerald-700">{srStats.completed}</p>
                <FiCheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">{ctx.t("الإجمالي", "Total")}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-900">{srStats.total}</p>
                <FiBell className="h-5 w-5 text-blue-600" />
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
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
