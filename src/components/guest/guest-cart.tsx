"use client";

import { useCallback, useEffect, useState } from "react";
import { FiMinus, FiPlus, FiShoppingCart, FiTrash2, FiX, FiCheck } from "react-icons/fi";
import type { AppLang } from "@/lib/i18n";

type CartItemRow = {
  id: number;
  service_item_id: number;
  item_name_en: string;
  item_name_ar: string;
  category_name_en: string;
  category_name_ar: string;
  estimated_cost: string | null;
  quantity: number;
  notes: string | null;
  scheduled_at: string | null;
};

type Props = { token: string; lang: AppLang };

export function GuestCart({ token, lang }: Props) {
  const [items, setItems] = useState<CartItemRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<string | null>(null);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/guest/cart?lang=${lang}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
  }, [lang]);

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener("cart-updated", h);
    return () => window.removeEventListener("cart-updated", h);
  }, [refresh]);

  const totalCost = items.reduce(
    (s, i) => s + (i.estimated_cost ? parseFloat(i.estimated_cost) * i.quantity : 0),
    0,
  );

  async function removeItem(id: number) {
    const fd = new FormData();
    fd.set("action", "remove");
    fd.set("id", String(id));
    fd.set("lang", lang);
    await fetch("/api/guest/cart", { method: "POST", body: fd });
    refresh();
  }

  async function checkout() {
    setLoading(true);
    const fd = new FormData();
    fd.set("action", "checkout");
    fd.set("lang", lang);
    const res = await fetch("/api/guest/cart", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (data.ok) {
      setCheckoutResult(data.message);
      setItems([]);
      window.dispatchEvent(new CustomEvent("guest-request-change"));
      setTimeout(() => {
        setCheckoutResult(null);
        setOpen(false);
      }, 2000);
    }
  }

  return (
    <>
      {/* Cart Badge Button */}
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
      >
        <FiShoppingCart className="h-4 w-4" />
        {items.length > 0 && (
          <span className="absolute -end-1 -top-1 grid h-4.5 w-4.5 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>

      {/* Drawer Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            className={`relative ms-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl ${
              lang === "ar" ? "animate-slide-right" : "animate-slide-left"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-bold text-slate-900">
                <FiShoppingCart className="me-2 inline h-5 w-5" />
                {t("سلة الطلبات", "Cart")} ({items.length})
              </h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <FiX className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Checkout success */}
            {checkoutResult && (
              <div className="mx-4 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                <FiCheck className="mx-auto mb-1 h-8 w-8 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-800">{checkoutResult}</p>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 && !checkoutResult && (
                <p className="mt-12 text-center text-sm text-slate-400">
                  {t("السلة فارغة", "Your cart is empty")}
                </p>
              )}
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {lang === "ar" ? item.item_name_ar : item.item_name_en}
                      </p>
                      <p className="text-xs text-slate-400">
                        {lang === "ar" ? item.category_name_ar : item.category_name_en}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-slate-500">×{item.quantity}</span>
                        {item.estimated_cost && (
                          <span className="text-xs font-medium text-blue-600">
                            ${(parseFloat(item.estimated_cost) * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="mt-0.5 text-[11px] text-slate-400 italic truncate">{item.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-slate-200 px-4 py-3">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{t("المجموع التقريبي", "Est. Total")}</span>
                  <span className="text-lg font-bold text-slate-900">${totalCost.toFixed(2)}</span>
                </div>
                <button
                  onClick={checkout}
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading
                    ? t("جارٍ الإرسال…", "Submitting…")
                    : t("تأكيد الطلبات", "Confirm All Orders")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
