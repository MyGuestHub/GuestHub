"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import {
  FiMessageCircle,
  FiSend,
  FiUser,
  FiSmile,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiCheckCircle,
  FiWifi,
  FiWifiOff,
} from "react-icons/fi";

type ChatSummary = {
  reservation_id: number;
  room_number: string;
  guest_name: string;
  last_message: string;
  last_at: string;
  unread_count: number;
};

type ChatMsg = {
  id: number;
  sender_type: "guest" | "staff";
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type Props = { lang: string; sessionToken: string };

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function timeAgo(iso: string, lang: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "ar" ? "الآن" : "now";
  if (mins < 60) return `${mins}${lang === "ar" ? "د" : "m"}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${lang === "ar" ? "س" : "h"}`;
  const days = Math.floor(hrs / 24);
  return `${days}${lang === "ar" ? "ي" : "d"}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatInbox({ lang, sessionToken }: Props) {
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeResId, setActiveResId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState<number | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const messagesRef = useRef<OverlayScrollbarsComponentRef>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeResIdRef = useRef<number | null>(null);
  const optimisticIdRef = useRef(-1);
  const quickEmojis = ["😀", "😍", "🙏", "👍", "👌", "🎉", "❤️", "😊"];

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const loadChats = useCallback(async () => {
    const res = await fetch("/api/admin/chat");
    if (res.ok) {
      const data = await res.json();
      const normalized: ChatSummary[] = (data.chats ?? []).map((c: ChatSummary) => ({
        ...c,
        reservation_id: toNum(c.reservation_id),
        unread_count: toNum(c.unread_count),
      }));
      setChats(normalized);
    }
  }, []);

  const loadMessages = useCallback(async (resId: number) => {
    const res = await fetch(`/api/admin/chat?reservationId=${resId}`);
    if (res.ok) {
      const data = await res.json();
      const normalized: ChatMsg[] = (data.messages ?? []).map((m: ChatMsg) => ({
        ...m,
        id: toNum(m.id),
      }));
      setMessages(normalized);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    activeResIdRef.current = activeResId;
  }, [activeResId]);

  // Connect WebSocket
  useEffect(() => {
    if (!mounted) return;

    let closedByEffect = false;

    const connect = () => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL
      || (window.location.protocol === "https:"
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname}:3001`);
    const ws = new WebSocket(`${wsBase}?session=${sessionToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttemptRef.current = 0;
    };
    ws.onclose = () => {
      setConnected(false);
      if (closedByEffect) return;
      const delay = Math.min(1000 * (reconnectAttemptRef.current + 1), 5000);
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === "chat:message") {
        const reservationId = toNum(msg.reservation_id);
        const isActive = toNum(activeResIdRef.current) === reservationId;

        // Update chat list immediately for better UX
        setChats((prev) => {
          const idx = prev.findIndex((c) => toNum(c.reservation_id) === reservationId);
          if (idx === -1) return prev;
          const current = prev[idx];
          const nextItem: ChatSummary = {
            ...current,
            last_message: msg.message,
            last_at: msg.created_at,
            unread_count:
              msg.sender_type === "guest" && !isActive
                ? current.unread_count + 1
                : isActive
                  ? 0
                  : current.unread_count,
          };
          const next = [...prev];
          next.splice(idx, 1);
          next.unshift(nextItem);
          return next;
        });

        // If in active conversation, add message
        if (isActive) {
          setMessages((prev) => [...prev, {
            id: toNum(msg.id),
            sender_type: msg.sender_type,
            sender_name: msg.sender_name,
            message: msg.message,
            is_read: true,
            created_at: msg.created_at,
          }]);
          // Mark as read
          ws.send(JSON.stringify({ type: "chat:read", reservationId }));
        }

        // Keep list synced if conversation wasn't in sidebar yet
        loadChats();
      }
      if (msg.type === "chat:typing" && msg.sender_type === "guest") {
        setTyping(toNum(msg.reservation_id));
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(null), 2000);
      }
    };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [mounted, sessionToken, loadChats]);

  // Load chats on mount
  useEffect(() => { loadChats(); }, [loadChats]);
  // Auto-scroll — only scroll the messages container, not the parent page
  useEffect(() => {
    const inst = messagesRef.current?.osInstance();
    if (inst) {
      const { viewport } = inst.elements();
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  // Realtime chat list refresh
  useEffect(() => {
    const iv = setInterval(loadChats, 10000);
    return () => clearInterval(iv);
  }, [loadChats]);

  function openChat(resId: number) {
    const normalizedResId = toNum(resId);
    setActiveResId(normalizedResId);
    setChats((prev) => prev.map((c) => (
      toNum(c.reservation_id) === normalizedResId ? { ...c, unread_count: 0 } : c
    )));
    loadMessages(normalizedResId);
    wsRef.current?.send(JSON.stringify({ type: "chat:read", reservationId: normalizedResId }));
  }

  function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== 1 || !activeResId) return;

    // Optimistic message so staff sees own message instantly.
    const optimisticId = optimisticIdRef.current;
    optimisticIdRef.current -= 1;
    const optimisticNow = new Date().toISOString();
    setMessages((prev) => [...prev, {
      id: optimisticId,
      sender_type: "staff",
      sender_name: "",
      message: trimmed,
      is_read: true,
      created_at: optimisticNow,
    }]);
    setChats((prev) => prev.map((c) => (
      c.reservation_id === activeResId
        ? { ...c, last_message: trimmed, last_at: optimisticNow }
        : c
    )));

    wsRef.current.send(JSON.stringify({ type: "chat:send", text: trimmed, reservationId: activeResId }));
    setText("");

    // Replace optimistic entry with canonical DB row to avoid duplicates/drift.
    window.setTimeout(() => {
      loadMessages(activeResId);
      loadChats();
    }, 250);
  }

  function handleKeyTyping() {
    if (wsRef.current?.readyState === 1 && activeResId) {
      wsRef.current.send(JSON.stringify({ type: "chat:typing", reservationId: activeResId }));
    }
  }

  function addEmoji(emoji: string) {
    setText((prev) => `${prev}${emoji}`);
  }

  const activeChat = chats.find((c) => c.reservation_id === activeResId);
  const BackIcon = lang === "ar" ? FiChevronRight : FiChevronLeft;

  if (!mounted) {
    return <div className="h-full rounded-2xl border border-white/10 bg-slate-900/40" />;
  }

  /* ── Conversation sidebar ── */
  const sidebar = (
    <div
      className={`flex h-full flex-col border-e border-white/[0.06] bg-slate-950/30 ${
        activeResId ? "hidden md:flex" : "flex"
      } w-full md:w-80 md:shrink-0`}
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
        <h3 className="text-[13px] font-semibold tracking-wide text-white/70 uppercase">
          {t("المحادثات", "Conversations")}
        </h3>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <FiWifi className="h-2.5 w-2.5" /> {t("متصل", "Live")}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              <FiWifiOff className="h-2.5 w-2.5" /> {t("غير متصل", "Offline")}
            </span>
          )}
        </div>
      </div>

      {/* Conversations list */}
      <OverlayScrollbarsComponent
        className="flex-1"
        defer
        options={{
          scrollbars: { theme: "os-theme-light", autoHide: "move", autoHideDelay: 800 },
          overflow: { x: "hidden" },
        }}
      >
        {chats.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/25">
            <FiMessageCircle className="h-10 w-10" />
            <p className="text-xs">{t("لا توجد محادثات", "No conversations")}</p>
          </div>
        )}
        {chats.map((chat) => {
          const isActive = toNum(activeResId) === toNum(chat.reservation_id);
          const isTyping = toNum(typing) === toNum(chat.reservation_id);
          const hasUnread = chat.unread_count > 0;
          return (
            <button
              key={toNum(chat.reservation_id)}
              onClick={() => openChat(toNum(chat.reservation_id))}
              className={`group relative w-full px-3 py-3 text-start transition-all ${
                isActive
                  ? "bg-white/[0.08]"
                  : "hover:bg-white/[0.04]"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-y-0 start-0 w-[3px] rounded-e-full bg-blue-500" />
              )}

              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  isActive ? "bg-blue-500/25 text-blue-300" : "bg-white/[0.06] text-white/50"
                }`}>
                  <FiUser className="h-4 w-4" />
                  {hasUnread && (
                    <span className="absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-blue-500/30">
                      {chat.unread_count}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm font-semibold ${hasUnread ? "text-white" : "text-white/80"}`}>
                      {chat.guest_name}
                    </p>
                    <span className="shrink-0 text-[10px] text-white/30">
                      {timeAgo(chat.last_at, lang)}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40">
                    {t("غرفة", "Room")} {chat.room_number}
                  </p>
                  <p className={`mt-0.5 truncate text-xs ${hasUnread ? "font-medium text-white/60" : "text-white/30"}`}>
                    {isTyping ? (
                      <span className="italic text-emerald-400">{t("يكتب…", "typing…")}</span>
                    ) : (
                      chat.last_message
                    )}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </OverlayScrollbarsComponent>
    </div>
  );

  /* ── Message panel ── */
  const messagePanel = activeResId && activeChat ? (
    <div className="flex h-full flex-1 flex-col min-w-0">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        {/* Back button (mobile) */}
        <button
          onClick={() => setActiveResId(null)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white md:hidden"
        >
          <BackIcon className="h-4 w-4" />
        </button>

        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-500/20 text-blue-300">
          <FiUser className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{activeChat.guest_name}</p>
          <p className="text-[11px] text-white/40">
            {t("غرفة", "Room")} {activeChat.room_number}
            {toNum(typing) === toNum(activeResId) && (
              <span className="ms-2 text-emerald-400">{t("يكتب…", "typing…")}</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <OverlayScrollbarsComponent
        ref={messagesRef}
        className="flex-1 overscroll-contain px-4 py-4"
        defer
        options={{
          scrollbars: { theme: "os-theme-light", autoHide: "move", autoHideDelay: 800 },
          overflow: { x: "hidden" },
        }}
      >
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.map((msg, i) => {
            const isStaff = msg.sender_type === "staff";
            const showAvatar =
              !isStaff &&
              (i === 0 || messages[i - 1]?.sender_type !== "guest");

            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isStaff ? "justify-end" : "justify-start"}`}>
                {/* Guest avatar */}
                {!isStaff && (
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/40 ${showAvatar ? "visible" : "invisible"}`}>
                    <FiUser className="h-3 w-3" />
                  </div>
                )}

                <div className={`group max-w-[75%] ${isStaff ? "items-end" : "items-start"}`}>
                  {/* Sender name for guest */}
                  {showAvatar && !isStaff && (
                    <p className="mb-1 ps-1 text-[10px] font-semibold text-blue-300/80">
                      {msg.sender_name}
                    </p>
                  )}

                  <div
                    className={`relative rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      isStaff
                        ? "rounded-ee-md bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/15"
                        : "rounded-es-md bg-white/[0.07] text-white/90"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    <div className={`mt-1 flex items-center gap-1 ${isStaff ? "justify-end" : "justify-start"}`}>
                      <span className={`text-[10px] ${isStaff ? "text-white/40" : "text-white/25"}`}>
                        {fmtTime(msg.created_at)}
                      </span>
                      {isStaff && (
                        <span className="text-white/40">
                          {msg.is_read ? (
                            <FiCheckCircle className="h-2.5 w-2.5 text-emerald-300/70" />
                          ) : (
                            <FiCheck className="h-2.5 w-2.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {toNum(typing) === toNum(activeResId) && (
            <div className="flex items-end gap-2">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/40">
                <FiUser className="h-3 w-3" />
              </div>
              <div className="rounded-2xl rounded-es-md bg-white/[0.07] px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

        </div>
      </OverlayScrollbarsComponent>
      <div className="border-t border-white/[0.06] bg-slate-950/20 px-3 py-3">
        {/* Emoji row */}
        {emojiOpen && (
          <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="rounded-lg px-2 py-1 text-lg transition hover:scale-110 hover:bg-white/10"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
              emojiOpen
                ? "bg-blue-500/20 text-blue-300"
                : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
            }`}
            aria-label={t("إيموجي", "Emoji")}
          >
            <FiSmile className="h-4 w-4" />
          </button>

          <input
            value={text}
            onChange={(e) => { setText(e.target.value); handleKeyTyping(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={t("اكتب ردك…", "Type your reply…")}
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-blue-500/40 focus:bg-white/[0.06]"
          />

          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-30 disabled:shadow-none"
          >
            <FiSend className={`h-4 w-4 ${lang === "ar" ? "scale-x-[-1]" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className={`flex-1 items-center justify-center ${activeResId ? "flex" : "hidden md:flex"}`}>
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.04]">
          <FiMessageCircle className="h-7 w-7 text-white/20" />
        </div>
        <p className="text-sm font-medium text-white/30">{t("اختر محادثة للبدء", "Select a conversation")}</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl">
      {sidebar}
      {messagePanel}
    </div>
  );
}
