import { FiGrid, FiPrinter, FiCheck, FiX, FiGlobe, FiDownload, FiLink } from "react-icons/fi";
import { PanelShell } from "@/components/panel/panel-shell";
import { CopyUrlButton } from "@/components/panel/copy-url-button";
import { listRoomQrTokens } from "@/lib/data";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function QrCodesPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "guests.manage", "dashboard");

  const rooms = await listRoomQrTokens();
  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const qrVersion = encodeURIComponent(appBaseUrl);
  const withToken = rooms.filter((r) => r.token);
  const withoutToken = rooms.filter((r) => !r.token);

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="qr-codes"
      title={ctx.t("رموز QR للغرف", "Room QR Codes")}
    >
      {query.error ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20">
            <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-rose-200">{query.error}</p>
        </div>
      ) : null}
      {query.ok ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-200">{query.ok}</p>
        </div>
      ) : null}

      {/* Domain configuration banner */}
      <div className="mb-4 rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
              <FiGlobe className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                {ctx.t("النطاق الأساسي لرموز QR", "QR Codes Base Domain")}
              </p>
              <p className="mt-0.5 font-mono text-sm font-medium text-cyan-300">
                {appBaseUrl}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {ctx.t("نشط", "Active")}
            </span>
            <CopyUrlButton
              text={appBaseUrl}
              label={ctx.t("نسخ", "Copy")}
              copiedLabel={ctx.t("تم النسخ!", "Copied!")}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2">
          <FiLink className="h-3.5 w-3.5 shrink-0 text-white/40" />
          <p className="text-xs text-white/50">
            {ctx.t(
              "جميع رموز QR تشير إلى هذا النطاق. يقوم الضيوف بمسح رمز QR للوصول مباشرة إلى خدمات غرفتهم.",
              "All QR codes point to this domain. Guests scan the QR code to directly access their room services."
            )}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-purple-400/40 bg-gradient-to-br from-purple-500/25 to-pink-500/25 p-4 text-center">
          <p className="text-3xl font-bold tracking-tight text-white">{rooms.length}</p>
          <p className="mt-1 text-xs text-white/70">{ctx.t("إجمالي الغرف", "Total Rooms")}</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/25 to-teal-500/25 p-4 text-center">
          <p className="text-3xl font-bold tracking-tight text-white">{withToken.length}</p>
          <p className="mt-1 text-xs text-emerald-200/70">{ctx.t("رمز QR مفعّل", "QR Active")}</p>
        </div>
        <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/25 to-orange-500/25 p-4 text-center">
          <p className="text-3xl font-bold tracking-tight text-white">{withoutToken.length}</p>
          <p className="mt-1 text-xs text-amber-200/70">{ctx.t("بدون رمز", "No QR")}</p>
        </div>
        <div className="rounded-2xl border border-blue-400/40 bg-gradient-to-br from-blue-500/25 to-cyan-500/25 p-4 text-center">
          <p className="text-3xl font-bold tracking-tight text-white">
            {rooms.filter((r) => r.has_active_reservation).length}
          </p>
          <p className="mt-1 text-xs text-blue-200/70">{ctx.t("حجز نشط", "Active Stay")}</p>
        </div>
      </div>

      {/* Bulk generate button */}
      {withoutToken.length > 0 ? (
        <form action="/api/room-qr" method="post" className="mb-4">
          <input type="hidden" name="lang" value={ctx.lang} />
          <input type="hidden" name="returnTo" value={`/${ctx.lang}/qr-codes`} />
          <input type="hidden" name="action" value="bulk" />
          <button className="flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500/35 to-teal-500/35 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:brightness-110">
            <FiGrid className="h-4 w-4" />
            {ctx.t(
              `إنشاء رمز QR لجميع الغرف (${withoutToken.length})`,
              `Generate QR for All Rooms (${withoutToken.length})`,
            )}
          </button>
        </form>
      ) : null}

      {/* Room QR grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rooms.map((room) => (
          <div
            key={room.room_id}
            className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition ${
              room.token
                ? "border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.06]"
                : "border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10"
            }`}
          >
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{room.room_number}</span>
                <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] text-white/70">
                  {room.room_type}
                </span>
                {room.floor ? (
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                    {ctx.t("طابق", "Floor")} {room.floor}
                  </span>
                ) : null}
              </div>
              {room.has_active_reservation ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                  <FiCheck className="h-3 w-3" />
                  {ctx.t("مشغولة", "Occupied")}
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-medium text-white/60">
                  {ctx.t("شاغرة", "Vacant")}
                </span>
              )}
            </div>

            {room.token ? (
              <div className="flex flex-col items-center gap-3 p-4">
                {/* QR Code image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/qr?path=${encodeURIComponent(`/guest/${room.token}`)}&v=${qrVersion}`}
                  alt={`QR ${room.room_number}`}
                  width={160}
                  height={160}
                  className="rounded-xl bg-white p-2"
                />

                {/* Guest name if occupied */}
                {room.guest_name ? (
                  <p className="text-xs text-white/70">
                    <span className="font-medium text-white/90">{room.guest_name}</span>
                  </p>
                ) : null}

                {/* Link display */}
                <div className="w-full rounded-lg bg-slate-900/40 px-3 py-2">
                  <p className="break-all text-center text-[11px] font-mono text-cyan-300/70">
                    {appBaseUrl}/guest/{room.token}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-2">
                  <CopyUrlButton
                    text={`${appBaseUrl}/guest/${room.token}`}
                    label={ctx.t("نسخ الرابط", "Copy URL")}
                    copiedLabel={ctx.t("تم النسخ!", "Copied!")}
                  />
                  <a
                    href={`/api/qr?path=${encodeURIComponent(`/guest/${room.token}`)}&v=${qrVersion}`}
                    download={`qr-room-${room.room_number}.svg`}
                    className="flex items-center gap-1 rounded-lg bg-white/12 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/20"
                    title={ctx.t("تحميل", "Download")}
                  >
                    <FiDownload className="h-3.5 w-3.5" />
                    {ctx.t("تحميل", "Download")}
                  </a>
                  <a
                    href={`/api/qr?path=${encodeURIComponent(`/guest/${room.token}`)}&v=${qrVersion}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-white/12 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/20"
                    title={ctx.t("طباعة", "Print")}
                  >
                    <FiPrinter className="h-3.5 w-3.5" />
                    {ctx.t("طباعة", "Print")}
                  </a>

                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-6">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/[0.08]">
                  <FiX className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-xs text-white/50">{ctx.t("لا يوجد رمز QR", "No QR code")}</p>
                <form action="/api/room-qr" method="post">
                  <input type="hidden" name="lang" value={ctx.lang} />
                  <input type="hidden" name="returnTo" value={`/${ctx.lang}/qr-codes`} />
                  <input type="hidden" name="action" value="single" />
                  <input type="hidden" name="roomId" value={room.room_id} />
                  <button className="rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500/35 to-teal-500/35 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:brightness-110">
                    {ctx.t("إنشاء رمز QR", "Generate QR")}
                  </button>
                </form>
              </div>
            )}

          </div>
        ))}
      </div>

      {rooms.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-white/60">{ctx.t("لا توجد غرف نشطة", "No active rooms found")}</p>
        </div>
      ) : null}
    </PanelShell>
  );
}
