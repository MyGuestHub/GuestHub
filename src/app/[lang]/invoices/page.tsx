import { PanelShell } from "@/components/panel/panel-shell";
import { InvoiceManagement } from "@/components/panel/invoice-management";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = { params: Promise<{ lang: string }> };

export default async function InvoicesPage({ params }: Props) {
  const routeParams = await params;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "billing.manage", "dashboard");

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="invoices"
      title={ctx.t("إدارة الفواتير", "Invoice Management")}
    >
      <InvoiceManagement lang={ctx.lang} />
    </PanelShell>
  );
}
