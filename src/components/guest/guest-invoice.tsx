"use client";

import { useCallback, useEffect, useState } from "react";
import { FiFileText, FiPrinter, FiX } from "react-icons/fi";
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <FiFileText className="h-4 w-4 text-indigo-500" />
        {t("الفاتورة", "Invoice")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-bold text-slate-900">
                <FiFileText className="me-2 inline h-5 w-5 text-indigo-500" />
                {t("فاتورتك", "Your Invoice")}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <FiPrinter className="h-4 w-4" />
                </button>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100">
                  <FiX className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">{t("جارٍ التحميل…", "Loading…")}</div>
            ) : invoice ? (
              <div className="p-4 space-y-4 print:p-2">
                {/* Guest info */}
                <div className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("الضيف", "Guest")}</span>
                    <span className="font-medium text-slate-800">{invoice.guest_name}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-slate-500">{t("الغرفة", "Room")}</span>
                    <span className="font-medium text-slate-800">{invoice.room_number}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-slate-500">{t("الحالة", "Status")}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      invoice.status === "paid" ? "bg-emerald-100 text-emerald-700"
                        : invoice.status === "closed" ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>{invoice.status.toUpperCase()}</span>
                  </div>
                </div>

                {/* Items */}
                {items.length > 0 ? (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <span>{t("الخدمة", "Service")}</span>
                      <span>{t("الكمية", "Qty")}</span>
                      <span>{t("المبلغ", "Amount")}</span>
                    </div>
                    {items.map((item) => (
                      <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-sm">
                        <span className="text-slate-700">{lang === "ar" ? item.description_ar : item.description_en}</span>
                        <span className="text-slate-500 text-center">{item.quantity}</span>
                        <span className="font-medium text-slate-800">${item.total}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-400">{t("لا توجد بنود بعد", "No charges yet")}</p>
                )}

                {/* Totals */}
                <div className="rounded-xl border border-slate-200 p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t("المجموع الفرعي", "Subtotal")}</span>
                    <span className="text-slate-700">${invoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t("الضريبة", "Tax")}</span>
                    <span className="text-slate-700">${invoice.tax_amount}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-1" />
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-slate-900">{t("الإجمالي", "Total")}</span>
                    <span className="font-bold text-blue-600">${invoice.total}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">{t("لا توجد فاتورة", "No invoice")}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
