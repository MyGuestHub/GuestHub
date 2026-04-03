"use client";

type Props = {
  lang: "ar" | "en";
};

export function GuestSessionExpired({ lang }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-slate-800">
          {lang === "ar" ? "انتهت جلستك" : "Session expired"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "ar"
            ? "لقد انتهت إقامتك أو تم تغيير الحجز. إذا كنت مهماناً حالياً، يرجى مسح رمز QR في غرفتك مرة أخرى."
            : "Your stay has ended or the reservation was changed. If you are a current guest, please scan the QR code in your room again."}
        </p>
      </div>
    </div>
  );
}
