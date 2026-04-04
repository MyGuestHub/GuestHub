import { PanelShell } from "@/components/panel/panel-shell";
import { ApiKeysManagement } from "@/components/panel/api-keys-management";
import { ApiPlayground } from "@/components/panel/api-playground";
import { listApiKeys } from "@/lib/data";
import { API_SCOPES } from "@/lib/api-auth";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ newKey?: string; ok?: string; error?: string; tab?: string }>;
};

export default async function ApiKeysPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "api.manage", "dashboard");

  const keys = await listApiKeys();

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="api-keys"
      title={ctx.t("مفاتيح API", "API Keys")}
    >
      {query.error && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20">
            <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-rose-200">{query.error}</p>
        </div>
      )}
      {query.ok && !query.newKey && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-200">{query.ok}</p>
        </div>
      )}

      <ApiKeysManagement
        lang={ctx.lang}
        keys={keys}
        newKey={query.newKey}
        basePath={`/${ctx.lang}/api-keys`}
        scopes={API_SCOPES as unknown as Record<string, string>}
      />

      {/* Divider */}
      <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* API Playground */}
      <ApiPlayground lang={ctx.lang} />
    </PanelShell>
  );
}
