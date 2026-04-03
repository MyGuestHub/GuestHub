import Link from "next/link";
import { FiLogOut, FiUser, FiCommand, FiChevronDown, FiGlobe } from "react-icons/fi";
import type { SessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { dirForLang, tr, type AppLang } from "@/lib/i18n";
import { NotificationBell } from "./notification-bell";
import { HtmlDirSetter } from "@/components/html-dir-setter";
import { BackNavButton } from "./back-nav-button";
import { ScrollArea } from "@/components/ui/scroll-area";

type NavKey =
  | "dashboard"
  | "rooms"
  | "guests"
  | "users"
  | "roles"
  | "reservations"
  | "service-requests"
  | "qr-codes"
  | "profile";

type Props = {
  lang: AppLang;
  user: SessionUser;
  active: NavKey;
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  children: React.ReactNode;
};

export function PanelShell({ lang, user, active, title, subtitle, backgroundImage, children }: Props) {
  const t = (ar: string, en: string) => tr(lang, ar, en);
  const activePath = active === "dashboard" ? "dashboard" : active;
  const switchLangPath = active === "dashboard" ? "dashboard" : activePath;
  const resolvedBackground = backgroundImage ?? "/back.jpeg";
  const hasBackground = Boolean(resolvedBackground);

  return (
    <div
      dir={dirForLang(lang)}
      className={`relative flex h-screen w-screen overflow-hidden ${
        hasBackground ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"
      }`}
    >
      <HtmlDirSetter lang={lang} />
      {hasBackground ? (
        <>
          <div
            className="absolute inset-0 scale-105 bg-slate-950 bg-cover bg-center bg-no-repeat blur-[2px]"
            style={{ backgroundImage: `url('${resolvedBackground}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/82 via-slate-900/72 to-slate-900/78" />
        </>
      ) : null}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header
          className={`relative z-50 shrink-0 ${
            hasBackground
              ? "border-b border-white/20 bg-slate-900/50 backdrop-blur-2xl"
              : "border-b border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            {/* Left: Minimal Navigation */}
            <div className="flex items-center gap-3">
              {active === "dashboard" ? (
                <Link
                  href={`/${lang}/dashboard`}
                  className="group"
                  aria-label="Dashboard"
                >
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 group-hover:scale-105 ${
                      hasBackground
                        ? "bg-slate-900/70 shadow-lg shadow-black/15"
                        : "bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md shadow-teal-500/20"
                    }`}
                  >
                    <FiCommand className="h-4.5 w-4.5 text-white" />
                  </div>
                </Link>
              ) : (
                <BackNavButton
                  fallbackHref={`/${lang}/dashboard`}
                  label={t("الرئيسية", "Home")}
                  dark={hasBackground}
                />
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <NotificationBell lang={lang} hasPermission={hasPermission(user, "services.manage")} />

              {/* Profile Menu */}
              <details className="group relative">
                <summary
                  className={`flex list-none items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all marker:content-none ${
                    hasBackground ? "bg-slate-900/50 hover:bg-slate-900/70" : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-full ${
                      hasBackground ? "bg-slate-900/90" : "bg-slate-200"
                    }`}
                  >
                    <FiUser className={`h-3.5 w-3.5 ${hasBackground ? "text-white" : "text-slate-700"}`} />
                  </div>
                  <span
                    className={`hidden max-w-28 truncate text-xs font-semibold lg:block ${
                      hasBackground ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {user.fullName}
                  </span>
                  <FiChevronDown
                    className={`h-3.5 w-3.5 transition-transform group-open:rotate-180 ${
                      hasBackground ? "text-white/70" : "text-slate-500"
                    }`}
                  />
                </summary>

                <div className="absolute end-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl">
                  <Link
                    href={`/${lang}/profile`}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                  >
                    <FiUser className="h-4 w-4" />
                    <span>{t("الملف الشخصي", "Profile")}</span>
                  </Link>

                  <div className="my-1 h-px bg-white/10" />

                  <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    {t("اللغة", "Language")}
                  </p>
                  <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                    <Link
                      href={`/en/${switchLangPath}`}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                        lang === "en"
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <FiGlobe className="h-3.5 w-3.5" /> EN
                    </Link>
                    <Link
                      href={`/ar/${switchLangPath}`}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                        lang === "ar"
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <FiGlobe className="h-3.5 w-3.5" /> AR
                    </Link>
                  </div>

                  <form action="/api/auth/logout" method="post" className="pt-1">
                    <input type="hidden" name="lang" value={lang} />
                    <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 hover:text-rose-100">
                      <FiLogOut className="h-4 w-4" />
                      <span>{t("خروج", "Logout")}</span>
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        <ScrollArea className="panel-glass relative z-0 flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
