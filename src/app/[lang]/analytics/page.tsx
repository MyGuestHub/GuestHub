import { PanelShell } from "@/components/panel/panel-shell";
import { AnalyticsDashboard } from "@/components/panel/analytics-dashboard";
import {
  getOccupancyTrend,
  getRevenueByCategory,
  getPopularItems,
  getRequestsByHour,
  getStaffPerformance,
  getSatisfactionTrend,
} from "@/lib/data";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = { params: Promise<{ lang: string }> };

export default async function AnalyticsPage({ params }: Props) {
  const routeParams = await params;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "analytics.view", "dashboard");

  const [occupancy, revenue, popular, hourly, staff, satisfaction] = await Promise.all([
    getOccupancyTrend(14),
    getRevenueByCategory(),
    getPopularItems(10),
    getRequestsByHour(),
    getStaffPerformance(),
    getSatisfactionTrend(14),
  ]);

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="analytics"
      title={ctx.t("التحليلات والتقارير", "Analytics & Reports")}
    >
      <AnalyticsDashboard
        lang={ctx.lang}
        occupancy={occupancy}
        revenue={revenue}
        popular={popular}
        hourly={hourly}
        staff={staff}
        satisfaction={satisfaction}
      />
    </PanelShell>
  );
}
