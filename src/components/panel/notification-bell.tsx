"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiBell } from "react-icons/fi";
import { playNotificationSound } from "@/lib/notification-sound";

type Notification = {
  id: number;
  guest_name: string;
  room_number: string;
  item_name_en: string;
  item_name_ar: string;
  request_status: string;
  created_at: string;
};

type Props = {
  lang: "ar" | "en";
  hasPermission: boolean;
};

export function NotificationBell({ lang, hasPermission }: Props) {
  const [mounted, setMounted] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [recentRequests, setRecentRequests] = useState<Notification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const isFirstFetch = useRef(true);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const viewAllHref = `/${lang}/service-requests?status=pending`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!hasPermission) return;
    try {
      const res = await fetch(
        `/api/service-requests/notifications?since=${encodeURIComponent("1970-01-01T00:00:00.000Z")}`,
      );
      if (!res.ok) return;
      const data: { count: number; requests: Notification[] } = await res.json();

      setPendingCount(data.count);
      setRecentRequests((data.requests ?? []).slice(0, 5));

      if (data.requests.length > 0) {
        const newOnes = data.requests.filter((r) => !seenIds.has(r.id));

        if (newOnes.length > 0 && !isFirstFetch.current) {
          playNotificationSound();
          setSeenIds((prev) => {
            const next = new Set(prev);
            for (const r of newOnes) next.add(r.id);
            return next;
          });
        }

        if (isFirstFetch.current) {
          setSeenIds(new Set(data.requests.map((r) => r.id)));
          isFirstFetch.current = false;
        }
      }
    } catch {
      // network error
    }
  }, [hasPermission, seenIds]);

  useEffect(() => {
    if (!hasPermission) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10_000);
    return () => clearInterval(interval);
  }, [hasPermission, fetchNotifications]);

  if (!hasPermission) return null;

  if (!mounted) {
    return (
      <a
        href={viewAllHref}
        className="relative rounded-xl bg-slate-900/60 p-2 text-white/80 transition hover:bg-slate-900/80 hover:text-white"
        aria-label={t("الإشعارات", "Notifications")}
      >
        <FiBell className="h-4 w-4" />
        {pendingCount > 0 ? (
          <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        ) : null}
      </a>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="relative rounded-xl bg-slate-900/60 p-2 text-white/80 transition hover:bg-slate-900/80 hover:text-white"
        aria-label={t("الإشعارات", "Notifications")}
      >
        <FiBell className="h-4 w-4" />
        {pendingCount > 0 ? (
          <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        ) : null}
      </button>

      <div
        className="pointer-events-none invisible absolute end-0 z-50 mt-2 w-80 translate-y-1 rounded-2xl border border-white/10 bg-slate-950/95 p-2 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
        role="menu"
        aria-label={t("قائمة الإشعارات", "Notifications menu")}
      >
        <div className="mb-2 flex items-center justify-between px-2 py-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            {t("آخر الطلبات", "Recent Requests")}
          </p>
          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-200">
            {pendingCount} {t("معلقة", "pending")}
          </span>
        </div>

        <div className="max-h-72 overflow-auto">
          {recentRequests.length === 0 ? (
            <div className="rounded-xl px-3 py-6 text-center text-xs text-white/60">
              {t("لا توجد طلبات جديدة حالياً", "No new requests right now")}
            </div>
          ) : (
            recentRequests.map((req) => (
              <div key={req.id} className="rounded-xl px-3 py-2.5 transition hover:bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-medium text-white/90">
                    {lang === "ar" ? req.item_name_ar : req.item_name_en}
                  </p>
                  <span className="shrink-0 text-[11px] text-white/50">
                    {new Date(req.created_at).toLocaleTimeString(lang === "ar" ? "ar" : "en", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/60">
                  {t("غرفة", "Room")} {req.room_number} • {req.guest_name}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="mt-2 border-t border-white/10 pt-2">
          <Link
            href={viewAllHref}
            className="block rounded-xl px-3 py-2 text-center text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/15 hover:text-cyan-200"
          >
            {t("عرض صفحة الإشعارات", "Open notifications page")}
          </Link>
        </div>
      </div>
    </div>
  );
}
