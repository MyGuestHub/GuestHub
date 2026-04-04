"use client";

import { useCallback, useEffect, useState } from "react";
import { FiHeart, FiPlus } from "react-icons/fi";
import type { AppLang } from "@/lib/i18n";

type Fav = {
  id: number;
  service_item_id: number;
  item_name_en: string;
  item_name_ar: string;
  category_name_en: string;
  category_name_ar: string;
  estimated_cost: string | null;
  order_count: number;
};

type Props = { lang: AppLang };

export function GuestFavorites({ lang }: Props) {
  const [items, setItems] = useState<Fav[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const load = useCallback(async () => {
    const res = await fetch(`/api/guest/favorites?lang=${lang}`);
    if (res.ok) setItems((await res.json()).items ?? []);
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  async function quickAdd(item: Fav) {
    setAddingId(item.service_item_id);
    const fd = new FormData();
    fd.set("action", "add");
    fd.set("serviceItemId", String(item.service_item_id));
    fd.set("quantity", "1");
    fd.set("lang", lang);
    await fetch("/api/guest/cart", { method: "POST", body: fd });
    window.dispatchEvent(new CustomEvent("cart-updated"));
    setTimeout(() => setAddingId(null), 600);
  }

  if (items.length === 0) return null;

  return (
    <section className="mb-5">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-white">
        <FiHeart className="h-4 w-4 text-rose-400" />
        {t("طلباتك المفضلة", "Your Favorites")}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => quickAdd(item)}
            disabled={addingId === item.service_item_id}
            className="group flex min-w-[140px] shrink-0 flex-col items-center gap-1 rounded-xl border border-white/10 bg-slate-900/50 p-3 text-center backdrop-blur-xl transition hover:border-cyan-500/25 hover:bg-white/[0.06] disabled:opacity-60"
          >
            <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/15 text-cyan-400 transition group-hover:bg-cyan-500/20">
              {addingId === item.service_item_id ? (
                <span className="text-xs font-bold text-emerald-400">✓</span>
              ) : (
                <FiPlus className="h-4 w-4" />
              )}
            </div>
            <p className="max-w-[120px] truncate text-xs font-medium text-white/90">
              {lang === "ar" ? item.item_name_ar : item.item_name_en}
            </p>
            {item.estimated_cost && (
              <p className="text-[10px] text-white/45">${item.estimated_cost}</p>
            )}
            <p className="text-[10px] text-cyan-400">
              {t("طُلبت", "Ordered")} {item.order_count}×
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
