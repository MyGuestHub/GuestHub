"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell } from "react-icons/fi";

type Notification = {
  id: number;
  created_at: string;
};

type Props = {
  lang: "ar" | "en";
  hasPermission: boolean;
};

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(1100, now + 0.1);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now + 0.15);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // AudioContext not available
  }
}

export function NotificationBell({ lang, hasPermission }: Props) {
  const [pendingCount, setPendingCount] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const sinceRef = useRef(new Date().toISOString());
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
      className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100"
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
