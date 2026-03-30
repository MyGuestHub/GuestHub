import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  listServiceItemsByCategory,
  listServiceRequestsByReservation,
  validateGuestToken,
} from "@/lib/data";
import { tr, type AppLang } from "@/lib/i18n";
import { GuestServiceForm } from "@/components/guest/guest-service-form";
import { GuestRequestsLive } from "@/components/guest/guest-requests-live";
import { HtmlDirSetter } from "@/components/html-dir-setter";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function GuestPortalPage({ params, searchParams }: Props) {
  const { token } = await params;
  const query = await searchParams;
  const guest = await validateGuestToken(token);
  if (!guest) notFound();

  const headersList = await headers();
  const acceptLang = headersList.get("accept-language") ?? "";
  const langOverride = query.lang === "ar" || query.lang === "en" ? query.lang : null;
  const lang: AppLang = langOverride ?? (acceptLang.toLowerCase().startsWith("en") ? "en" : "ar");
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

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <HtmlDirSetter lang={lang} />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-600">GuestHub</p>
            <p className="text-sm font-semibold">
              {t("مرحبًا", "Welcome")}, {guest.guestName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/guest/${token}?lang=${otherLang}`}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
            >
              {lang === "ar" ? "EN" : "عربي"}
            </a>
            <div className="text-end">
              <p className="text-xs text-slate-400">
                {t("الغرفة", "Room")}{" "}
                <span className="font-mono font-bold text-slate-700">{guest.roomNumber}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {/* Stay info card */}
        <section className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500">{t("تسجيل الدخول", "Check-in")}</p>
              <p className="text-sm font-semibold text-slate-800">{checkInDate}</p>
            </div>
            <div className="h-px flex-1 mx-4 bg-blue-200" />
            <div className="text-end">
              <p className="text-xs text-blue-500">{t("تسجيل الخروج", "Check-out")}</p>
              <p className="text-sm font-semibold text-slate-800">{checkOutDate}</p>
            </div>
          </div>
        </section>

        <GuestRequestsLive token={token} lang={lang} initialRequests={myRequests} />

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {t("طلب خدمة جديدة", "Request a Service")}
          </h2>
          <GuestServiceForm token={token} categories={categories} lang={lang} />
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        GuestHub &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
