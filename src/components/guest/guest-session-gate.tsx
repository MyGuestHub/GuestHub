"use client";

import { useState } from "react";
import { verifyGuestPhone } from "@/app/guest/[token]/actions";
import type { VerifyResult } from "@/app/guest/[token]/actions";

type Props = {
  token: string;
  lang: "ar" | "en";
  expired?: boolean;
};

export function GuestSessionGate({ token, lang, expired }: Props) {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const errorMessages: Record<string, string> = {
    invalid_token: t(
      "لا يوجد حجز نشط لهذه الغرفة حالياً. يرجى التواصل مع الاستقبال.",
      "There is no active reservation for this room. Please contact the front desk.",
    ),
    no_phone: t(
      "لم يتم تسجيل رقم هاتف لهذا الحجز. يرجى التواصل مع الاستقبال.",
      "No phone number is registered for this reservation. Please contact the front desk.",
    ),
    phone_mismatch: t(
      "رقم الهاتف غير مطابق للحجز الحالي.",
      "Phone number does not match the current reservation.",
    ),
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const result: VerifyResult = await verifyGuestPhone(token, phone.trim());
      if (result.ok) {
        window.location.reload();
      } else {
        setError(errorMessages[result.error] ?? t("حدث خطأ", "Something went wrong"));
      }
    } catch {
      setError(t("خطأ في الاتصال. حاول مرة أخرى.", "Connection error. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-6">
      {/* Background image + blur overlay (same as portal) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <img src="/back.jpeg" alt="" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/90 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/15">
            <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">GuestHub</p>
          <h1 className="mt-1 text-lg font-bold text-white">
            {t("التحقق من رقم الهاتف", "Phone Verification")}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {t(
              "أدخل رقم هاتفك المسجل في الحجز للوصول إلى الخدمات.",
              "Enter the phone number registered with your reservation to access services.",
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-white/50">
              {t("رقم الهاتف", "Phone Number")}
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("مثال: 0501234567", "e.g. 0501234567")}
              required
              dir="ltr"
              className="w-full rounded-xl border border-white/15 bg-slate-800/60 px-4 py-3 text-base text-white/90 placeholder:text-white/30 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !phone.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
          >
            {submitting
              ? t("جاري التحقق…", "Verifying…")
              : t("تأكيد والدخول", "Verify & Enter")}
          </button>
        </form>
      </div>
    </div>
  );
}
