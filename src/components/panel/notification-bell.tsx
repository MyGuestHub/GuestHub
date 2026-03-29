"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell, FiX } from "react-icons/fi";

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

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // First tone — a pleasant chime
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

    // Second tone — slightly delayed
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

    // Cleanup
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // AudioContext not available — ignore silently
  }
}

export function NotificationBell({ lang, hasPermission }: Props) {
  const [pendingCount, setPendingCount] = useState(0);
  const [recentRequests, setRecentRequests] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
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
        // Check for truly new requests
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

        setRecentRequests(data.requests);
        // Move the since cursor forward
        sinceRef.current = data.requests[0].created_at;
      }
    } catch {
      // network error — ignore
    }
  }, [hasPermission, seenIds]);

  useEffect(() => {
    if (!hasPermission) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10_000); // poll every 10s
    return () => clearInterval(interval);
  }, [hasPermission, fetchNotifications]);

  if (!hasPermission) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel((prev) => !prev)}
        className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100"
        aria-label={t("الإشعارات", "Notifications")}
      >
        <FiBell className="h-4 w-4" />
        {pendingCount > 0 ? (
          <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        ) : null}
      </button>

      {showPanel ? (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowPanel(false)}
          />
          {/* Panel */}
          <div className="absolute end-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {t("طلبات جديدة", "New Requests")}
              </h3>
              <button
                onClick={() => setShowPanel(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {recentRequests.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-400">
                  {t("لا توجد طلبات جديدة", "No new requests")}
                </p>
              ) : (
                recentRequests.map((r) => (
                  <div
                    key={r.id}
                    className="border-b border-slate-50 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {lang === "ar" ? r.item_name_ar : r.item_name_en}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {r.guest_name} — {t("الغرفة", "Room")} {r.room_number}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        {t("معلّق", "Pending")}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(r.created_at).toLocaleTimeString(lang === "ar" ? "ar" : "en", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
            {recentRequests.length > 0 ? (
              <a
                href={`/${lang}/service-requests?status=pending`}
                className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-medium text-blue-600 hover:bg-slate-50"
              >
                {t("عرض جميع الطلبات", "View all requests")}
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
