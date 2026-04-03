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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">GuestHub</p>
          <h1 className="mt-1 text-lg font-bold text-slate-800">
            {t("التحقق من رقم الهاتف", "Phone Verification")}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              "أدخل رقم هاتفك المسجل في الحجز للوصول إلى الخدمات.",
              "Enter the phone number registered with your reservation to access services.",
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-slate-600">
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
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !phone.trim()}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
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
