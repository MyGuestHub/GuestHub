import { FiAlertCircle, FiCheckCircle, FiClock, FiLoader, FiXCircle } from "react-icons/fi";
import { PanelShell } from "@/components/panel/panel-shell";
import { Pagination } from "@/components/panel/pagination";
import {
  getServiceRequestStats,
  listActiveReservations,
  listServiceItemOptions,
  listServiceRequestsPaginated,
  listStaffUsers,
} from "@/lib/data";
import { CreateRequestForm } from "@/components/panel/create-request-form";
import { AppSelect } from "@/components/ui/app-select";
import { readPager, requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    error?: string;
    ok?: string;
  }>;
};

const statusMeta: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  dot: string;
  badge: string;
  cardBg: string;
  cardBorder: string;
}> = {
  pending: {
    icon: FiClock,
    dot: "bg-amber-400",
    badge: "bg-[rgba(251,191,36,0.22)] text-amber-50 ring-1 ring-amber-200/50",
    cardBg: "bg-[rgba(251,191,36,0.08)]",
    cardBorder: "border-amber-400/20",
  },
  accepted: {
    icon: FiAlertCircle,
    dot: "bg-blue-400",
    badge: "bg-[rgba(59,130,246,0.24)] text-blue-50 ring-1 ring-blue-200/50",
    cardBg: "bg-[rgba(59,130,246,0.08)]",
    cardBorder: "border-blue-400/20",
  },
  in_progress: {
    icon: FiLoader,
    dot: "bg-indigo-400",
    badge: "bg-[rgba(99,102,241,0.24)] text-indigo-50 ring-1 ring-indigo-200/50",
    cardBg: "bg-[rgba(99,102,241,0.08)]",
    cardBorder: "border-indigo-400/20",
  },
  completed: {
    icon: FiCheckCircle,
    dot: "bg-emerald-400",
    badge: "bg-[rgba(16,185,129,0.24)] text-emerald-50 ring-1 ring-emerald-200/50",
    cardBg: "bg-[rgba(16,185,129,0.08)]",
    cardBorder: "border-emerald-400/20",
  },
  cancelled: {
    icon: FiXCircle,
    dot: "bg-slate-400",
    badge: "bg-[rgba(100,116,139,0.24)] text-slate-200 ring-1 ring-slate-300/30",
    cardBg: "bg-[rgba(100,116,139,0.08)]",
    cardBorder: "border-slate-400/20",
  },
};

const statusKeys = ["pending", "accepted", "in_progress", "completed", "cancelled"] as const;

export default async function ServiceRequestsPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "services.manage", "dashboard");

  const pager = readPager(query, { pageSize: 15 });
  const statusFilter = query.status || undefined;

  const [requests, stats, staffList, reservations, serviceItems] = await Promise.all([
    listServiceRequestsPaginated(pager.page, pager.pageSize, { status: statusFilter }),
    getServiceRequestStats(),
    listStaffUsers(),
    listActiveReservations(),
    listServiceItemOptions(),
  ]);

  const totalActive = stats.pending + stats.accepted + stats.in_progress;
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const statusLabel = (s: string) => {
    const map: Record<string, [string, string]> = {
      pending: ["معلّق", "Pending"],
      accepted: ["مقبول", "Accepted"],
      in_progress: ["قيد التنفيذ", "In Progress"],
      completed: ["مكتمل", "Completed"],
      cancelled: ["ملغى", "Cancelled"],
    };
    const pair = map[s];
    return pair ? ctx.t(pair[0], pair[1]) : s;
  };

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="service-requests"
      title={ctx.t("طلبات الخدمة", "Service Requests")}
    >
      {query.error ? (
        <p className="mb-3 rounded-2xl border border-rose-400/30 bg-[rgba(244,63,94,0.12)] px-4 py-2 text-sm text-rose-200">
          {query.error}
        </p>
      ) : null}
      {query.ok ? (
        <p className="mb-3 rounded-2xl border border-emerald-400/30 bg-[rgba(16,185,129,0.12)] px-4 py-2 text-sm text-emerald-200">
          {query.ok}
        </p>
      ) : null}

      {/* ── Status stat cards ── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statusKeys.map((s) => {
          const meta = statusMeta[s];
          const Icon = meta.icon;
          const isActive = statusFilter === s;
          return (
            <a
              key={s}
              href={`/${ctx.lang}/service-requests?status=${s}`}
              className={`rounded-2xl border p-4 backdrop-blur-sm transition hover:bg-white/[0.06] ${
                isActive
                  ? `${meta.cardBorder} ${meta.cardBg} ring-2 ring-white/20`
                  : "border-white/10 bg-[rgba(255,255,255,0.08)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                <p className="text-xs text-white/60">{statusLabel(s)}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-2xl font-bold text-white">
                  {stats[s as keyof typeof stats]}
                </p>
                <Icon className="h-5 w-5 text-white/30" />
              </div>
            </a>
          );
        })}
      </section>

      {/* ── Filter + Summary row ── */}
      <section className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.08)] p-4 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-white">
            {ctx.t("فلتر الحالة", "Status Filter")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`/${ctx.lang}/service-requests`}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                !statusFilter
                  ? "border-cyan-400/40 bg-[rgba(34,211,238,0.15)] text-cyan-200"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {ctx.t("الكل", "All")} ({stats.total})
            </a>
            {statusKeys.map((s) => {
              const meta = statusMeta[s];
              return (
                <a
                  key={s}
                  href={`/${ctx.lang}/service-requests?status=${s}`}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === s
                      ? `${meta.cardBorder} ${meta.cardBg} text-white`
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {statusLabel(s)} ({stats[s as keyof typeof stats]})
                </a>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.08)] p-4 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-white">
            {ctx.t("خلاصه", "Summary")}
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-[rgba(251,191,36,0.12)] px-3 py-2">
              <p className="text-xs text-amber-200">{ctx.t("مفتوحة", "Open")}</p>
              <p className="mt-1 text-lg font-bold text-white">{totalActive}</p>
            </div>
            <div className="rounded-xl bg-[rgba(16,185,129,0.12)] px-3 py-2">
              <p className="text-xs text-emerald-200">{ctx.t("مكتملة", "Done")}</p>
              <p className="mt-1 text-lg font-bold text-white">{stats.completed}</p>
            </div>
            <div className="rounded-xl bg-[rgba(255,255,255,0.08)] px-3 py-2">
              <p className="text-xs text-white/60">{ctx.t("إنجاز", "Rate")}</p>
              <p className="mt-1 text-lg font-bold text-white">{completionRate}%</p>
            </div>
          </div>
        </article>
      </section>

      {statusFilter ? (
        <div className="mt-3">
          <a
            href={`/${ctx.lang}/service-requests`}
            className="text-sm text-cyan-300 underline transition hover:text-cyan-200"
          >
            {ctx.t("عرض الكل", "Show all")}
          </a>
        </div>
      ) : null}

      {/* Create request */}
      <CreateRequestForm
        lang={ctx.lang}
        reservations={reservations}
        serviceItems={serviceItems}
        returnTo={`/${ctx.lang}/service-requests${statusFilter ? `?status=${statusFilter}` : ""}`}
      />

      {/* ── Requests table ── */}
      <section className="mt-4 overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.10)] shadow-[0_10px_24px_rgba(2,6,23,0.24)] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(255,255,255,0.12)] text-white/70">
              <tr>
                <th className="px-4 py-3 text-start font-medium">#</th>
                <th className="px-4 py-3 text-start font-medium">{ctx.t("الضيف", "Guest")}</th>
                <th className="px-4 py-3 text-start font-medium">{ctx.t("الغرفة", "Room")}</th>
                <th className="px-4 py-3 text-start font-medium">{ctx.t("الفئة", "Category")}</th>
                <th className="px-4 py-3 text-start font-medium">{ctx.t("الخدمة", "Service")}</th>
                <th className="px-4 py-3 text-start font-medium">{ctx.t("الحالة", "Status")}</th>
                <th className="px-4 py-3 text-start font-medium">{ctx.t("المعيّن", "Assigned")}</th>
                <th className="px-4 py-3 text-start font-medium">{ctx.t("التاريخ", "Date")}</th>
                <th className="px-4 py-3 text-start font-medium">{ctx.t("إجراءات", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-white/30">
                    {ctx.t("لا توجد طلبات", "No requests found")}
                  </td>
                </tr>
              ) : null}
              {requests.rows.map((r) => {
                const meta = statusMeta[r.request_status] ?? statusMeta.pending;
                const StatusIcon = meta.icon;
                return (
                  <tr key={r.id} className="text-white/85 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
                    <td className="px-4 py-3 font-mono text-xs text-white/40">{r.id}</td>
                    <td className="px-4 py-3 font-medium">{r.guest_name}</td>
                    <td className="px-4 py-3 font-mono text-white/70">{r.room_number}</td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {ctx.lang === "ar" ? r.category_name_ar : r.category_name_en}
                    </td>
                    <td className="px-4 py-3">
                      {ctx.lang === "ar" ? r.item_name_ar : r.item_name_en}
                      {r.quantity > 1 ? (
                        <span className="ms-1 text-xs text-white/40">×{r.quantity}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusLabel(r.request_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.assigned_to_name ?? (
                        <span className="text-white/25">{ctx.t("غير معيّن", "Unassigned")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {new Date(r.created_at).toLocaleDateString(ctx.lang === "ar" ? "ar" : "en", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {r.request_status !== "completed" && r.request_status !== "cancelled" ? (
                          <form
                            action="/api/service-requests"
                            method="post"
                            className="flex flex-wrap items-center gap-1"
                          >
                            <input type="hidden" name="lang" value={ctx.lang} />
                            <input type="hidden" name="action" value="update_status" />
                            <input type="hidden" name="requestId" value={r.id} />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={`/${ctx.lang}/service-requests${statusFilter ? `?status=${statusFilter}` : ""}`}
                            />
                            <AppSelect
                              name="status"
                              defaultValue=""
                              required
                              className="rounded-lg px-2 py-1 text-xs"
                            >
                              <option value="" disabled>
                                {ctx.t("تغيير", "Change")}
                              </option>
                              {r.request_status !== "accepted" ? (
                                <option value="accepted">{statusLabel("accepted")}</option>
                              ) : null}
                              {r.request_status !== "in_progress" ? (
                                <option value="in_progress">{statusLabel("in_progress")}</option>
                              ) : null}
                              <option value="completed">{statusLabel("completed")}</option>
                              <option value="cancelled">{statusLabel("cancelled")}</option>
                            </AppSelect>
                            <AppSelect
                              name="assignedTo"
                              className="rounded-lg px-2 py-1 text-xs"
                            >
                              <option value="">{ctx.t("تعيين", "Assign")}</option>
                              {staffList.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.full_name}
                                </option>
                              ))}
                            </AppSelect>
                            <button className="rounded-lg bg-cyan-500/80 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-cyan-500">
                              {ctx.t("حفظ", "Save")}
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                        <form action="/api/service-requests" method="post">
                          <input type="hidden" name="lang" value={ctx.lang} />
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="requestId" value={r.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={`/${ctx.lang}/service-requests${statusFilter ? `?status=${statusFilter}` : ""}`}
                          />
                          <button className="rounded-lg bg-rose-400/20 px-2.5 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/30">
                            {ctx.t("حذف", "Delete")}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination
        lang={ctx.lang}
        basePath={`/${ctx.lang}/service-requests${statusFilter ? `?status=${statusFilter}` : ""}`}
        page={requests.pagination.page}
        pageSize={requests.pagination.pageSize}
        total={requests.pagination.total}
      />
    </PanelShell>
  );
}
