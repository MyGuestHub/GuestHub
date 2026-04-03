"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell } from "react-icons/fi";
import { playNotificationSound } from "@/lib/notification-sound";

type Notification = {
  id: number;
  created_at: string;
};

type Props = {
  lang: "ar" | "en";
  hasPermission: boolean;
};

export function NotificationBell({ lang, hasPermission }: Props) {
  const [pendingCount, setPendingCount] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const sinceRef = useRef(new Date().toISOString());
  const previousPendingCount = useRef(0);
  const isFirstFetch = useRef(true);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const fetchNotifications = useCallback(async () => {
    if (!hasPermission) return;
    try {
      const res = await fetch(
        `/api/service-requests/notifications?since=${encodeURIComponent(sinceRef.current)}`,
      );
      if (!res.ok) return;
      const data: { count: number; requests: Notification[] } = await res.json();

      setPendingCount(data.count);

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

        sinceRef.current = data.requests[0].created_at;
      }

      if (!isFirstFetch.current && data.count > previousPendingCount.current) {
        playNotificationSound();
      }

      previousPendingCount.current = data.count;
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

  return (
    <a
      href={`/${lang}/service-requests?status=pending`}
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
