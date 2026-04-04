import { PanelShell } from "@/components/panel/panel-shell";
import { ComplaintsManagement } from "@/components/panel/complaints-management";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = { params: Promise<{ lang: string }> };

export default async function ComplaintsPage({ params }: Props) {
  const routeParams = await params;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "complaints.manage", "dashboard");

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="complaints"
      title={ctx.t("إدارة الشكاوى", "Complaints Management")}
    >
      <ComplaintsManagement lang={ctx.lang} />
    </PanelShell>
  );
}
