import { PanelShell } from "@/components/panel/panel-shell";
import { LostFoundManagement } from "@/components/panel/lost-found-management";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = { params: Promise<{ lang: string }> };

export default async function LostFoundPage({ params }: Props) {
  const routeParams = await params;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "lost_found.manage", "dashboard");

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="lost-found"
      title={ctx.t("المفقودات والموجودات", "Lost & Found")}
    >
      <LostFoundManagement lang={ctx.lang} />
    </PanelShell>
  );
}
