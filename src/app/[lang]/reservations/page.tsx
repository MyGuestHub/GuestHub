import { PanelShell } from "@/components/panel/panel-shell";
import { Pagination } from "@/components/panel/pagination";
import { ReservationsLiveView } from "@/components/panel/reservations-live-view";
import { listAvailableRoomsOptions, listGuestOptions, listReservationsBoard, listReservationsPaginated } from "@/lib/data";
import { readPager, requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string; error?: string; ok?: string }>;
};

export default async function ReservationsPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "guests.manage", "dashboard");

  const pager = readPager(query, { pageSize: 10 });
  const [reservations, board, guestOptions, roomOptions] = await Promise.all([
    listReservationsPaginated(pager.page, pager.pageSize),
    listReservationsBoard(),
    listGuestOptions(),
    listAvailableRoomsOptions(),
  ]);

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="reservations"
      title={ctx.t("إدارة الحجوزات", "Reservations Management")}
    >
      {query.error ? (
        <p className="mb-3 rounded-2xl bg-rose-500/25 px-4 py-3 text-sm font-medium text-rose-100">
          {query.error}
        </p>
      ) : null}
      {query.ok ? (
        <p className="mb-3 rounded-2xl bg-emerald-500/25 px-4 py-3 text-sm font-medium text-emerald-100">
          {query.ok}
        </p>
      ) : null}

      <ReservationsLiveView
        lang={ctx.lang}
        initialRows={reservations.rows}
        allReservations={board}
        guestOptions={guestOptions}
        roomOptions={roomOptions}
      />

      <div className="mt-6">
        <Pagination
          lang={ctx.lang}
          basePath={`/${ctx.lang}/reservations`}
        page={reservations.pagination.page}
        pageSize={reservations.pagination.pageSize}
        total={reservations.pagination.total}
        />
      </div>
    </PanelShell>
  );
}
