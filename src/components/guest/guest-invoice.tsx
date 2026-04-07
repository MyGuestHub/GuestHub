"use client";

import { useCallback, useEffect, useState } from "react";
import { FiFileText, FiX } from "react-icons/fi";
import type { AppLang } from "@/lib/i18n";

type InvoiceData = {
  id: number;
  guest_name: string;
  room_number: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  currency: string;
  status: string;
};

type InvoiceItem = {
  id: number;
  description_en: string;
  description_ar: string;
  quantity: number;
  unit_price: string;
  total: string;
};

type Props = { lang: AppLang };

export function GuestInvoice({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const [focusPayment, setFocusPayment] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/guest/invoice?lang=${lang}`);
    if (res.ok) {
      const data = await res.json();
      setInvoice(data.invoice);
      setItems(data.items ?? []);
    }
    setLoading(false);
  }, [lang]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    const onOpenInvoice = (ev: Event) => {
      const custom = ev as CustomEvent<{ focusPayment?: boolean }>;
      setFocusPayment(Boolean(custom.detail?.focusPayment));
      setOpen(true);
    };
    window.addEventListener("guest-invoice-open", onOpenInvoice as EventListener);
    return () => window.removeEventListener("guest-invoice-open", onOpenInvoice as EventListener);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/50 px-3 py-2 text-sm font-medium text-white/70 backdrop-blur-xl transition hover:bg-white/[0.06]"
      >
        <FiFileText className="h-4 w-4 text-indigo-400" />
        {t("الفاتورة", "Invoice")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-3 py-3 sm:px-4">
              <h2 className="text-base font-bold text-white">
                <FiFileText className="me-2 inline h-5 w-5 text-indigo-400" />
                {t("فاتورتك", "Your Invoice")}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/10">
                  <FiX className="h-5 w-5 text-white/50" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-white/40">{t("جارٍ التحميل…", "Loading…")}</div>
            ) : invoice ? (
              <div className="space-y-4 p-3 pb-[max(env(safe-area-inset-bottom),0.85rem)] sm:p-4">
                {/* Guest info */}
                <div className="rounded-xl bg-white/5 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">{t("الضيف", "Guest")}</span>
                    <span className="font-medium text-white/90">{invoice.guest_name}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-white/50">{t("الغرفة", "Room")}</span>
                    <span className="font-medium text-white/90">{invoice.room_number}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-white/50">{t("الحالة", "Status")}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      invoice.status === "paid" ? "bg-emerald-500/15 text-emerald-400"
                        : invoice.status === "closed" ? "bg-amber-500/15 text-amber-400"
                        : "bg-blue-500/15 text-blue-400"
                    }`}>{invoice.status.toUpperCase()}</span>
                  </div>
                </div>

                {/* Items */}
                {items.length > 0 ? (
                  <div className="divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      <span>{t("الخدمة", "Service")}</span>
                      <span>{t("الكمية", "Qty")}</span>
                      <span>{t("المبلغ", "Amount")}</span>
                    </div>
                    {items.map((item) => (
                      <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 px-3 py-2 text-sm">
                        <span className="truncate text-white/80">{lang === "ar" ? item.description_ar : item.description_en}</span>
                        <span className="text-white/50 text-center">{item.quantity}</span>
                        <span className="font-medium text-white/90">${item.total}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-white/40">{t("لا توجد بنود بعد", "No charges yet")}</p>
                )}

                {/* Totals */}
                <div className="rounded-xl border border-white/10 p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t("المجموع الفرعي", "Subtotal")}</span>
                    <span className="text-white/80">${invoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t("الضريبة", "Tax")}</span>
                    <span className="text-white/80">${invoice.tax_amount}</span>
                  </div>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-white">{t("الإجمالي", "Total")}</span>
                    <span className="font-bold text-cyan-400">${invoice.total}</span>
                  </div>
                </div>

                {invoice.status !== "paid" && (
                  <div className={`rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 ${focusPayment ? "ring-2 ring-indigo-400/60" : ""}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-indigo-200">
                        {t("الدفع", "Payment")}
                      </p>
                      <span className="text-xs text-indigo-300/80">{t("معلومة", "Info")}</span>
                    </div>
                    <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                      {t(
                        "لإتمام الدفع، يرجى مراجعة رسبشن الفندق.",
                        "To complete payment, please visit the hotel reception.",
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-white/40">{t("لا توجد فاتورة", "No invoice")}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
