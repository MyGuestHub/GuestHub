import { PanelShell } from "@/components/panel/panel-shell";
import { HousekeepingBoard } from "@/components/panel/housekeeping-board";
import { listHousekeepingTasks, listRoomStatus, listStaffUsers } from "@/lib/data";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = { params: Promise<{ lang: string }> };

export default async function HousekeepingPage({ params }: Props) {
  const routeParams = await params;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "housekeeping.manage", "dashboard");

  const [tasks, rooms, staff] = await Promise.all([
    listHousekeepingTasks(),
    listRoomStatus(),
    listStaffUsers(),
  ]);

  const roomOptions = rooms.map((r) => ({ id: r.id, room_number: r.room_number }));

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="housekeeping"
      title={ctx.t("إدارة التنظيف", "Housekeeping")}
    >
      <HousekeepingBoard
        lang={ctx.lang}
        initialTasks={tasks}
        rooms={roomOptions}
        staff={staff}
      />
    </PanelShell>
  );
}
