"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiMessageCircle } from "react-icons/fi";

type ChatSummary = {
  unread_count: number;
};

type Props = {
  lang: "ar" | "en";
  hasPermission: boolean;
};

export function ChatUnreadBell({ lang, hasPermission }: Props) {
  const [unreadCount, setUnreadCount] = useState(0);
  const previousUnread = useRef(0);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const fetchUnread = useCallback(async () => {
    if (!hasPermission) return;
    try {
      const res = await fetch("/api/admin/chat");
      if (!res.ok) return;
      const data: { chats?: ChatSummary[] } = await res.json();
      const total = (data.chats ?? []).reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setUnreadCount(total);
      previousUnread.current = total;
    } catch {
      // ignore network hiccups
    }
  }, [hasPermission]);

  useEffect(() => {
    if (!hasPermission) return;
    fetchUnread();
    const iv = setInterval(fetchUnread, 8000);
    return () => clearInterval(iv);
  }, [hasPermission, fetchUnread]);

  if (!hasPermission) return null;

  return (
    <a
      href={`/${lang}/chat`}
      className="relative rounded-xl bg-slate-900/60 p-2 text-white/80 transition hover:bg-slate-900/80 hover:text-white"
      aria-label={t("رسائل الدردشة", "Chat Messages")}
    >
      <FiMessageCircle className="h-4 w-4" />
      {unreadCount > 0 ? (
        <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-cyan-500/35">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </a>
  );
}
