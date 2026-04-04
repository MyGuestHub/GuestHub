"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiSend, FiUser, FiSmile } from "react-icons/fi";

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

export function ChatInbox({ lang, sessionToken }: Props) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeResId, setActiveResId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState<number | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
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
    activeResIdRef.current = activeResId;
  }, [activeResId]);

  // Connect WebSocket
  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL
      || (window.location.protocol === "https:"
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname}:3001`);
    const ws = new WebSocket(`${wsBase}?session=${sessionToken}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
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

    return () => ws.close();
  }, [sessionToken, loadChats]);

  // Load chats on mount
  useEffect(() => { loadChats(); }, [loadChats]);
  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl">
      {/* Sidebar: Chat list */}
      <div className="w-80 shrink-0 border-e border-white/10 overflow-y-auto">
        <div className="border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-semibold text-white/80">
            {t("المحادثات", "Conversations")}
            {connected && <span className="ms-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />}
          </h3>
        </div>
        {chats.length === 0 && (
          <p className="px-4 py-10 text-center text-xs text-white/40">{t("لا توجد محادثات", "No conversations")}</p>
        )}
        {chats.map((chat) => (
          <button
            key={toNum(chat.reservation_id)}
            onClick={() => openChat(toNum(chat.reservation_id))}
            className={`w-full border-b border-white/5 px-4 py-3 text-start transition hover:bg-white/5 ${
              toNum(activeResId) === toNum(chat.reservation_id)
                ? "bg-white/10"
                : chat.unread_count > 0
                  ? "bg-cyan-500/5"
                  : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-500/20 text-blue-300">
                  <FiUser className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{chat.guest_name}</p>
                  <p className="text-[11px] text-white/50">
                    {t("غرفة", "Room")} {chat.room_number}
                    {toNum(typing) === toNum(chat.reservation_id) && (
                      <span className="ms-1 text-emerald-400">{t("يكتب…", "typing…")}</span>
                    )}
                  </p>
                </div>
              </div>
              {chat.unread_count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                  {chat.unread_count}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-white/40">{chat.last_message}</p>
          </button>
        ))}
      </div>

      {/* Main: Messages */}
      <div className="flex flex-1 flex-col min-w-0">
        {activeResId && activeChat ? (
          <>
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">{activeChat.guest_name}</p>
              <p className="text-xs text-white/50">{t("غرفة", "Room")} {activeChat.room_number}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === "staff" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                    msg.sender_type === "staff"
                      ? "rounded-ee-sm bg-blue-600 text-white"
                      : "rounded-es-sm bg-white/10 text-white/90"
                  }`}>
                    {msg.sender_type === "guest" && (
                      <p className="mb-0.5 text-[10px] font-semibold text-blue-300">{msg.sender_name}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className={`mt-0.5 text-[10px] ${msg.sender_type === "staff" ? "text-white/50" : "text-white/30"}`}>
                      {new Date(msg.created_at).toLocaleTimeString(lang === "ar" ? "ar" : "en", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {toNum(typing) === toNum(activeResId) && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-es-sm bg-white/10 px-3 py-2 animate-pulse">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.1s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-white/10 px-4 py-3">
              {emojiOpen && (
                <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-2">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="rounded-lg px-2 py-1 text-base transition hover:bg-white/10"
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
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label={t("إيموجي", "Emoji")}
                >
                  <FiSmile className="h-4 w-4" />
                </button>
                <input
                  value={text}
                  onChange={(e) => { setText(e.target.value); handleKeyTyping(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={t("اكتب ردك…", "Type your reply…")}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400 placeholder:text-white/30"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim()}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
                >
                  <FiSend className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <FiMessageCircle className="mx-auto mb-3 h-12 w-12 text-white/20" />
              <p className="text-sm text-white/40">{t("اختر محادثة للبدء", "Select a conversation to start")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
