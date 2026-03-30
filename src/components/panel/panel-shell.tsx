import Link from "next/link";
import { FiBell, FiBookOpen, FiCalendar, FiGrid, FiHome, FiLayers, FiLogOut, FiUser, FiUsers } from "react-icons/fi";
import type { SessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { dirForLang, tr, type AppLang } from "@/lib/i18n";
import { NotificationBell } from "./notification-bell";
import { LiveClock } from "./live-clock";
import { HtmlDirSetter } from "@/components/html-dir-setter";

type NavKey =
  | "dashboard"
  | "rooms"
  | "guests"
  | "users"
  | "roles"
  | "reservations"
  | "service-requests"
  | "profile";

type Props = {
  lang: AppLang;
  user: SessionUser;
  active: NavKey;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

type NavItem = {
  key: NavKey;
  href: (lang: AppLang) => string;
  icon: React.ComponentType<{ className?: string }>;
  labelAr: string;
  labelEn: string;
};

const navItems: NavItem[] = [
  {
    key: "dashboard",
    href: (lang) => `/${lang}/dashboard`,
    icon: FiHome,
    labelAr: "لوحة التحكم",
    labelEn: "Dashboard",
  },
  {
    key: "rooms",
    href: (lang) => `/${lang}/rooms`,
    icon: FiLayers,
    labelAr: "الغرف",
    labelEn: "Rooms",
  },
  {
    key: "guests",
    href: (lang) => `/${lang}/guests`,
    icon: FiUsers,
    labelAr: "الضيوف",
    labelEn: "Guests",
  },
  {
    key: "users",
    href: (lang) => `/${lang}/users`,
    icon: FiUser,
    labelAr: "المستخدمون",
    labelEn: "Users",
  },
  {
    key: "roles",
    href: (lang) => `/${lang}/roles`,
    icon: FiBookOpen,
    labelAr: "الأدوار",
    labelEn: "Roles",
  },
  {
    key: "reservations",
    href: (lang) => `/${lang}/reservations`,
    icon: FiCalendar,
    labelAr: "الحجوزات",
    labelEn: "Reservations",
  },
  {
    key: "service-requests",
    href: (lang) => `/${lang}/service-requests`,
    icon: FiBell,
    labelAr: "طلبات الخدمة",
    labelEn: "Service Requests",
  },
];

export function PanelShell({ lang, user, active, title, subtitle, children }: Props) {
  const t = (ar: string, en: string) => tr(lang, ar, en);

  return (
    <div dir={dirForLang(lang)} className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800">
      <HtmlDirSetter lang={lang} />
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-e border-slate-200 bg-slate-900 text-slate-300 lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-white">
            <FiGrid className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-white">GUESTHUB</p>
            <p className="text-[10px] text-slate-500">{t("إدارة الفندق", "Hotel Operations")}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href(lang)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive
                    ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tr(lang, item.labelAr, item.labelEn)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-[10px] text-slate-600">v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Top bar ── */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-600 text-white lg:hidden">
              <FiGrid className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-900 md:text-base">{title}</h1>
              {subtitle ? <p className="truncate text-[11px] text-slate-500">{subtitle}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 md:flex">
              <Link
                href={`/en/${active === "dashboard" ? "dashboard" : active}`}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${lang === "en" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
              >
                EN
              </Link>
              <Link
                href={`/ar/${active === "dashboard" ? "dashboard" : active}`}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${lang === "ar" ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
              >
                AR
              </Link>
            </div>

            <NotificationBell lang={lang} hasPermission={hasPermission(user, "services.manage")} />

            <Link
              href={`/${lang}/profile`}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 md:inline-flex"
            >
              <FiUser className="h-3.5 w-3.5" />
              {user.fullName}
            </Link>

            <form action="/api/auth/logout" method="post">
              <input type="hidden" name="lang" value={lang} />
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700">
                <FiLogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("خروج", "Logout")}</span>
              </button>
            </form>
          </div>
        </header>

        {/* ── Mobile nav ── */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href(lang)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tr(lang, item.labelAr, item.labelEn)}
              </Link>
            );
          })}
        </div>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="flex h-10 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 md:px-6">
          <p className="text-[11px] font-medium text-slate-400">GuestHub</p>
          <LiveClock lang={lang} />
        </footer>
      </div>
    </div>
  );
}
