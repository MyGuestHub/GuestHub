import Link from "next/link";
import { FiBell, FiBookOpen, FiCalendar, FiHome, FiLayers, FiLogOut, FiUser, FiUsers } from "react-icons/fi";
import type { SessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { tr, type AppLang } from "@/lib/i18n";
import { NotificationBell } from "./notification-bell";

type NavKey = "dashboard" | "rooms" | "guests" | "users" | "roles" | "reservations" | "service-requests";

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
    labelAr: "لوحة الغرف",
    labelEn: "Rooms Dashboard",
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
  const isAr = lang === "ar";

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-slate-700">
      <div className="grid h-full w-full grid-rows-[72px_minmax(0,1fr)_52px]">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600/20 text-blue-600">
              <FiHome className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-600">GuestHub</p>
              <h1 className="text-sm font-semibold md:text-base">{title}</h1>
              {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 md:flex">
              <Link
                href={`/en/${active === "dashboard" ? "dashboard" : active}`}
                className={`rounded-lg px-3 py-1.5 text-xs ${lang === "en" ? "bg-blue-600 text-white" : "text-slate-600"}`}
              >
                EN
              </Link>
              <Link
                href={`/ar/${active === "dashboard" ? "dashboard" : active}`}
                className={`rounded-lg px-3 py-1.5 text-xs ${lang === "ar" ? "bg-blue-600 text-white" : "text-slate-600"}`}
              >
                AR
              </Link>
            </div>
            <NotificationBell lang={lang} hasPermission={hasPermission(user, "services.manage")} />
            <Link
              href={`/${lang}/users/${user.id}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            >
              {user.fullName}
            </Link>
            <form action="/api/auth/logout" method="post">
              <input type="hidden" name="lang" value={lang} />
              <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                <FiLogOut className="h-4 w-4" />
                {t("خروج", "Logout")}
              </button>
            </form>
          </div>
        </header>

        <div className="grid min-h-0 w-full grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden min-h-0 border-r border-slate-200 bg-white lg:block">
            <nav className="flex h-full flex-col gap-2 overflow-y-auto p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const itemActive = item.key === active;
                return (
                  <Link
                    key={item.key}
                    href={item.href(lang)}
                    className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                      itemActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tr(lang, item.labelAr, item.labelEn)}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="min-h-0 overflow-y-auto bg-slate-50 p-3 md:p-5">
            <div className="mb-3 grid grid-cols-3 gap-2 lg:hidden">
              {navItems.map((item) => {
                const itemActive = item.key === active;
                return (
                  <Link
                    key={item.key}
                    href={item.href(lang)}
                    className={`rounded-xl px-2 py-2 text-center text-xs ${
                      itemActive ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {tr(lang, item.labelAr, item.labelEn)}
                  </Link>
                );
              })}
            </div>
            {children}
          </main>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-4 text-xs text-slate-400 md:px-6">
          <p>{t("پنل مدیریت هتل", "Hotel Operations Panel")}</p>
          <p>{isAr ? "domain.com/ar" : "domain.com/en"}</p>
        </footer>
      </div>
    </div>
  );
}
