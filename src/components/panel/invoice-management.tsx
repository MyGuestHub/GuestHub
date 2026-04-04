"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiDollarSign, FiEye, FiFileText } from "react-icons/fi";

type Invoice = {
  id: number;
  reservation_id: number;
  guest_name: string;
  room_number: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  currency: string;
  status: string;
  created_at: string;
};

type InvItem = {
  id: number;
  description_en: string;
  description_ar: string;
  quantity: number;
  unit_price: string;
  total: string;
};

type Props = { lang: string };

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/20 text-amber-300",
  closed: "bg-blue-500/20 text-blue-300",
  paid: "bg-emerald-500/20 text-emerald-300",
};

export function InvoiceManagement({ lang }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [items, setItems] = useState<InvItem[]>([]);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/invoices");
    if (res.ok) setInvoices((await res.json()).invoices ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  async function expand(inv: Invoice) {
    if (expandedId === inv.id) { setExpandedId(null); return; }
    setExpandedId(inv.id);
    const res = await fetch(`/api/admin/invoices?invoiceId=${inv.id}`);
    if (res.ok) setItems((await res.json()).items ?? []);
  }

  async function syncInvoice(reservationId: number) {
    const fd = new FormData();
    fd.set("action", "sync");
    fd.set("reservationId", String(reservationId));
    await fetch("/api/admin/invoices", { method: "POST", body: fd });
    load();
  }

  async function updateStatus(invoiceId: number, status: string) {
    const fd = new FormData();
    fd.set("action", "status");
    fd.set("invoiceId", String(invoiceId));
    fd.set("status", status);
    await fetch("/api/admin/invoices", { method: "POST", body: fd });
    load();
  }

  const totalAll = invoices.reduce((s, i) => s + parseFloat(i.total || "0"), 0);
  const paidTotal = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + parseFloat(i.total || "0"), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-900/60 p-4 backdrop-blur-xl">
          <p className="text-xs text-white/50">{t("إجمالي الفواتير", "Total Invoiced")}</p>
          <p className="mt-1 text-2xl font-bold text-white">${totalAll.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-4 backdrop-blur-xl">
          <p className="text-xs text-white/50">{t("المدفوع", "Paid")}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">${paidTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-4 backdrop-blur-xl">
          <p className="text-xs text-white/50">{t("المستحق", "Outstanding")}</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">${(totalAll - paidTotal).toFixed(2)}</p>
        </div>
      </div>

      {/* Invoice list */}
      <div className="space-y-2">
        {invoices.length === 0 && (
          <div className="rounded-2xl bg-slate-900/50 p-10 text-center text-sm text-white/40">
            <FiFileText className="mx-auto mb-2 h-8 w-8" />
            {t("لا توجد فواتير", "No invoices")}
          </div>
        )}
        {invoices.map((inv) => (
          <div key={inv.id} className="rounded-2xl bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <button onClick={() => expand(inv)} className="w-full px-4 py-3 text-start">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-500/20 text-indigo-300">
                    <FiFileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      #{inv.id} — {inv.guest_name}
                    </p>
                    <p className="text-xs text-white/50">
                      {t("غرفة", "Room")} {inv.room_number} • {new Date(inv.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-white">${inv.total}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[inv.status] ?? ""}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            </button>

            {expandedId === inv.id && (
              <div className="border-t border-white/5 px-4 py-3 space-y-3">
                {/* Items */}
                {items.length > 0 ? (
                  <div className="divide-y divide-white/5 rounded-lg bg-white/5">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2 text-xs">
                        <span className="text-white/70">{lang === "ar" ? item.description_ar : item.description_en}</span>
                        <div className="flex items-center gap-3 text-white/50">
                          <span>×{item.quantity}</span>
                          <span className="font-medium text-white">${item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40">{t("لا توجد بنود", "No line items")}</p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => syncInvoice(inv.reservation_id)}
                    className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-600/40">
                    {t("مزامنة", "Sync Items")}
                  </button>
                  {inv.status === "open" && (
                    <button onClick={() => updateStatus(inv.id, "closed")}
                      className="rounded-lg bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-600/40">
                      {t("إغلاق", "Close")}
                    </button>
                  )}
                  {(inv.status === "open" || inv.status === "closed") && (
                    <button onClick={() => updateStatus(inv.id, "paid")}
                      className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-600/40">
                      <FiCheck className="me-0.5 inline h-3 w-3" /> {t("تم الدفع", "Mark Paid")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
