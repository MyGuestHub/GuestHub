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
    if (guest) {
      return renderPortal(guest, token, lang);
    }
    // Session expired → show phone form; it will clear stale cookie on next verify
  }

  // No session (or stale session) → show phone verification
  return <GuestSessionGate token={token} lang={lang} expired={!!sessionCookie} />;
}

import type { GuestContext } from "@/lib/data";

async function renderPortal(guest: GuestContext, token: string, lang: AppLang) {
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
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <HtmlDirSetter lang={lang} />
      <GuestSessionFixer />

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">GuestHub</p>
            <p className="text-sm font-semibold text-slate-800">
              {t("مرحبًا", "Welcome")}, {guest.guestName}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href={`/guest/${token}?lang=${otherLang}`}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
            >
              {lang === "ar" ? "EN" : "عربي"}
            </a>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {guest.roomNumber}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">
        {/* ── Stay info card ── */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-stretch">
            <div className="flex-1 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                {t("تسجيل الدخول", "Check-in")}
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">{checkInDate}</p>
            </div>
            <div className="flex flex-col items-center justify-center px-3">
              <div className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">
                {nights} {t("ليلة", nights === 1 ? "night" : "nights")}
              </div>
              <div className="mt-1 h-px w-8 bg-blue-200" />
            </div>
            <div className="flex-1 p-4 text-end">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                {t("تسجيل الخروج", "Check-out")}
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">{checkOutDate}</p>
            </div>
          </div>
        </section>

        {/* ── Active requests ── */}
        <GuestRequestsLive token={token} lang={lang} initialRequests={myRequests} />

        {/* ── Services ── */}
        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">
            {t("خدمات الفندق", "Hotel Services")}
          </h2>
          <GuestServiceForm token={token} categories={categories} lang={lang} />
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-4 text-center text-[11px] text-slate-400">
        GuestHub &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
