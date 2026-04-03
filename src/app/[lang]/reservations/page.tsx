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
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20">
            <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-rose-200">{query.error}</p>
        </div>
      ) : null}
      {query.ok ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-200">{query.ok}</p>
        </div>
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
