import { PanelShell } from "@/components/panel/panel-shell";
import { Pagination } from "@/components/panel/pagination";
import { hasPermission } from "@/lib/auth";
import { listRoomsPaginated } from "@/lib/data";
import { readPager, requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string; error?: string; ok?: string }>;
};

function statusClass(status: "available" | "occupied" | "maintenance") {
  if (status === "available") return "bg-emerald-100 text-emerald-700";
  if (status === "occupied") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

export default async function RoomsPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "occupancy.view", "dashboard");

  const pager = readPager(query, { pageSize: 12 });
  const rooms = await listRoomsPaginated(pager.page, pager.pageSize);
  const canManageRooms = hasPermission(ctx.user, "rooms.manage");

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="rooms"
      title={ctx.t("إدارة الغرف", "Rooms Management")}
      subtitle={ctx.t("عرض الغرف مع حالة الإشغال المباشرة", "Room list with live occupancy")}
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

      {canManageRooms ? (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">{ctx.t("إضافة غرفة جديدة", "Add New Room")}</h2>
          <form action="/api/rooms" method="post" className="mt-3 grid gap-3 md:grid-cols-5">
            <input type="hidden" name="lang" value={ctx.lang} />
            <input type="hidden" name="returnTo" value={`/${ctx.lang}/rooms`} />
            <input
              name="roomNumber"
              required
              placeholder={ctx.t("رقم الغرفة", "Room number")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <input
              name="floor"
              type="number"
              placeholder={ctx.t("الطابق", "Floor")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <input
              name="roomType"
              placeholder={ctx.t("نوع الغرفة", "Room type")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <input
              name="capacity"
              type="number"
              min={1}
              defaultValue={2}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              {ctx.t("حفظ", "Save")}
            </button>
          </form>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">{ctx.t("الغرفة", "Room")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("الطابق", "Floor")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("النوع", "Type")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("السعة", "Capacity")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("الحالة", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {rooms.rows.map((room) => (
                <tr key={room.id} className="border-t border-slate-200 text-slate-700">
                  <td className="px-4 py-3 font-medium">{room.room_number}</td>
                  <td className="px-4 py-3">{room.floor ?? "-"}</td>
                  <td className="px-4 py-3">{room.room_type}</td>
                  <td className="px-4 py-3">{room.capacity}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${statusClass(room.live_status)}`}>
                      {room.live_status === "available"
                        ? ctx.t("متاحة", "Available")
                        : room.live_status === "occupied"
                          ? ctx.t("مشغولة", "Occupied")
                          : ctx.t("صيانة", "Maintenance")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination
        lang={ctx.lang}
        basePath={`/${ctx.lang}/rooms`}
        page={rooms.pagination.page}
        pageSize={rooms.pagination.pageSize}
        total={rooms.pagination.total}
      />
    </PanelShell>
  );
}
