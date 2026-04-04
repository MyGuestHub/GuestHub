import { PanelShell } from "@/components/panel/panel-shell";
import { ActivityFeed } from "@/components/panel/activity-feed";
import { getRecentActivity } from "@/lib/data";
import { requirePanelContext } from "@/lib/panel";

type Props = { params: Promise<{ lang: string }> };

export default async function ActivityLogPage({ params }: Props) {
  const routeParams = await params;
  const ctx = await requirePanelContext(routeParams.lang);

  const events = await getRecentActivity(50);

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="activity-log"
      title={ctx.t("سجل الأحداث", "Activity Log")}
    >
      <ActivityFeed lang={ctx.lang} initialEvents={events} />
    </PanelShell>
  );
}
