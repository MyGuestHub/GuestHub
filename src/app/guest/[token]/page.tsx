import { cookies, headers } from "next/headers";
import {
  listServiceItemsByCategory,
  listServiceRequestsByReservation,
  validateGuestSession,
} from "@/lib/data";
import { tr, type AppLang } from "@/lib/i18n";
import { GuestServiceForm } from "@/components/guest/guest-service-form";
import { GuestRequestsLive } from "@/components/guest/guest-requests-live";
import { HtmlDirSetter } from "@/components/html-dir-setter";
import { GuestSessionGate } from "@/components/guest/guest-session-gate";
import { GuestSessionFixer } from "@/components/guest/guest-session-fixer";
import { GuestCart } from "@/components/guest/guest-cart";
import { GuestChat } from "@/components/guest/guest-chat";
import { GuestInvoice } from "@/components/guest/guest-invoice";
import { GuestQuickActions } from "@/components/guest/guest-quick-actions";
import { GuestFavorites } from "@/components/guest/guest-favorites";
import { GuestComplaintForm } from "@/components/guest/guest-complaints";
import { GuestFacilities } from "@/components/guest/guest-facilities";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function GuestPortalPage({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;

  const headersList = await headers();
  const acceptLang = headersList.get("accept-language") ?? "";
  const langOverride = sp.lang === "ar" || sp.lang === "en" ? sp.lang : null;
  const lang: AppLang = langOverride ?? (acceptLang.toLowerCase().startsWith("en") ? "en" : "ar");

  /* ── Session-based access (phone-verified) for ALL token types ── */
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("guest_session")?.value;

  if (sessionCookie) {
    const guest = await validateGuestSession(sessionCookie);
    if (guest && guest.token === token) {
      return renderPortal(guest, token, lang, sessionCookie);
    }
  }

  return <GuestSessionGate token={token} lang={lang} expired={!!sessionCookie} />;
}

import type { GuestContext } from "@/lib/data";

async function renderPortal(guest: GuestContext, token: string, lang: AppLang, sessionToken: string) {
  const t = (ar: string, en: string) => tr(lang, ar, en);

  const [categories, myRequests] = await Promise.all([
    listServiceItemsByCategory(),
    listServiceRequestsByReservation(guest.reservationId),
  ]);

  const otherLang = lang === "ar" ? "en" : "ar";
  const checkInDate = new Date(guest.checkIn).toLocaleDateString(lang === "ar" ? "ar" : "en", {
    weekday: "short", month: "short", day: "numeric",
  });
  const checkOutDate = new Date(guest.checkOut).toLocaleDateString(lang === "ar" ? "ar" : "en", {
    weekday: "short", month: "short", day: "numeric",
  });

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(guest.checkOut).getTime() - new Date(guest.checkIn).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="guest-glass relative flex min-h-screen flex-col bg-slate-950 text-slate-100"
    >
      <HtmlDirSetter lang={lang} />
      <GuestSessionFixer />

      {/* ── Blurred background ── */}
      <div
        className="pointer-events-none fixed inset-0 scale-105 bg-slate-950 bg-cover bg-center bg-no-repeat blur-[2px]"
        style={{ backgroundImage: `url('/back.jpeg')` }}
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-slate-950/82 via-slate-900/72 to-slate-900/78" />

      {/* ── Header ── */}
      <header className="gh-surface-strong sticky top-0 z-20">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">GuestHub</p>
            <p className="text-sm font-semibold text-white/90">
              {t("مرحبًا", "Welcome")}, {guest.guestName}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <GuestCart token={token} lang={lang} />
            <a
              href={`/guest/${token}?lang=${otherLang}`}
              className="rounded-full border border-white/15 px-2.5 py-1 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white"
            >
              {lang === "ar" ? "EN" : "عربي"}
            </a>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/25">
              {guest.roomNumber}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 py-5">
        {/* ── Stay info card ── */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-900/30 via-slate-900/50 to-indigo-900/30 backdrop-blur-xl">
          <div className="flex items-stretch">
            <div className="flex-1 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                {t("تسجيل الدخول", "Check-in")}
              </p>
              <p className="mt-0.5 text-sm font-bold text-white">{checkInDate}</p>
            </div>
            <div className="flex flex-col items-center justify-center px-3">
              <div className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md shadow-cyan-500/20">
                {nights} {t("ليلة", nights === 1 ? "night" : "nights")}
              </div>
              <div className="mt-1 h-px w-8 bg-white/15" />
            </div>
            <div className="flex-1 p-4 text-end">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                {t("تسجيل الخروج", "Check-out")}
              </p>
              <p className="mt-0.5 text-sm font-bold text-white">{checkOutDate}</p>
            </div>
          </div>
        </section>

        {/* ── Quick Actions: DND, Wake-up ── */}
        <GuestQuickActions lang={lang} />

        {/* ── Action buttons: Invoice, Facilities, Complaints ── */}
        <div className="mb-5 flex flex-wrap gap-2">
          <GuestInvoice lang={lang} />
          <GuestFacilities lang={lang} />
          <GuestComplaintForm lang={lang} />
        </div>

        {/* ── Favorites ── */}
        <GuestFavorites lang={lang} />

        {/* ── Active requests ── */}
        <GuestRequestsLive token={token} lang={lang} initialRequests={myRequests} />

        {/* ── Services ── */}
        <section>
          <h2 className="mb-3 text-base font-bold text-white">
            {t("خدمات الفندق", "Hotel Services")}
          </h2>
          <GuestServiceForm token={token} categories={categories} lang={lang} />
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-4 text-center text-[11px] text-white/30">
        GuestHub &copy; {new Date().getFullYear()}
      </footer>

      {/* ── Floating Chat ── */}
      <GuestChat token={token} lang={lang} guestSessionToken={sessionToken} />
    </div>
  );
}
