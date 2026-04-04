import { PanelShell } from "@/components/panel/panel-shell";
import { FacilityCalendar } from "@/components/panel/facility-calendar";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = { params: Promise<{ lang: string }> };

export default async function FacilitiesPage({ params }: Props) {
  const routeParams = await params;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "facilities.manage", "dashboard");

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="facilities"
      title={ctx.t("إدارة المرافق", "Facility Management")}
    >
      <FacilityCalendar lang={ctx.lang} />
    </PanelShell>
  );
}
