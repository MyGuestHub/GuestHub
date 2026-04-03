"use client";

import { useEffect, useState } from "react";
import { activateGuestSession } from "@/app/guest/[token]/actions";

type Props = {
  token: string;
  lang: "ar" | "en";
};

export function GuestSessionGate({ token, lang }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    activateGuestSession(token).then((ok) => {
      if (cancelled) return;
      if (ok) {
        window.location.reload();
      } else {
        setFailed(true);
      }
    });
    return () => { cancelled = true; };
  }, [token]);

  if (failed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-800">
            {lang === "ar" ? "الرابط غير صالح" : "Link unavailable"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {lang === "ar"
              ? "لا يوجد حجز نشط لهذه الغرفة حالياً. يرجى التواصل مع الاستقبال."
              : "There is no active reservation for this room. Please contact the front desk."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-slate-500">
          {lang === "ar" ? "جاري التحقق..." : "Verifying..."}
        </p>
      </div>
    </div>
  );
}
