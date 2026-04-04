import { cookies } from "next/headers";
import { PanelShell } from "@/components/panel/panel-shell";
import { ChatInboxClientOnly } from "@/components/panel/chat-inbox-client-only";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";
import { SESSION_COOKIE } from "@/lib/auth";

type Props = { params: Promise<{ lang: string }> };

export default async function ChatPage({ params }: Props) {
  const routeParams = await params;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "chat.manage", "dashboard");

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value ?? "";

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="chat"
      title={ctx.t("الدردشة مع الضيوف", "Guest Chat")}
    >
      <ChatInboxClientOnly lang={ctx.lang} sessionToken={sessionToken} />
    </PanelShell>
  );
}
