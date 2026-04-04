"use client";

type Props = {
  lang: "ar" | "en";
};

export function GuestSessionExpired({ lang }: Props) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="pointer-events-none absolute inset-0 z-0">
        <img src="/back.jpeg" alt="" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/90 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
          <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-white">
          {lang === "ar" ? "انتهت جلستك" : "Session expired"}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {lang === "ar"
            ? "لقد انتهت إقامتك أو تم تغيير الحجز. إذا كنت مهماناً حالياً، يرجى مسح رمز QR في غرفتك مرة أخرى."
            : "Your stay has ended or the reservation was changed. If you are a current guest, please scan the QR code in your room again."}
        </p>
      </div>
    </div>
  );
}
