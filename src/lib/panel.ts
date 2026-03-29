import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission, type SessionUser } from "@/lib/auth";
import { resolveLang, tr, type AppLang } from "@/lib/i18n";

export type PanelContext = {
  lang: AppLang;
  user: SessionUser;
  t: (ar: string, en: string) => string;
};

export async function requirePanelContext(rawLang: string): Promise<PanelContext> {
  const lang = resolveLang(rawLang);
  if (lang !== rawLang) {
    redirect(`/${lang}/dashboard`);
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${lang}/login`);
  }

  return {
    lang,
    user,
    t: (ar: string, en: string) => tr(lang, ar, en),
  };
}

export function requirePermissionOrRedirect(
  ctx: PanelContext,
  permissionCode: string,
  fallbackPath: string,
) {
  if (!hasPermission(ctx.user, permissionCode)) {
    const message = encodeURIComponent(ctx.t("لا تملك صلاحية", "Access denied"));
    redirect(`/${ctx.lang}/${fallbackPath}?error=${message}`);
  }
}

export function readPager(
  input: { page?: string; pageSize?: string },
  defaults: { page?: number; pageSize?: number } = {},
) {
  const defaultPage = defaults.page ?? 1;
  const defaultPageSize = defaults.pageSize ?? 10;
  const page = Number.parseInt(input.page ?? String(defaultPage), 10);
  const pageSize = Number.parseInt(input.pageSize ?? String(defaultPageSize), 10);

  return {
    page: Number.isFinite(page) && page > 0 ? page : defaultPage,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? pageSize : defaultPageSize,
  };
}
