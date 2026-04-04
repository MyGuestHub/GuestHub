"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiSend, FiUser } from "react-icons/fi";

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

export function ChatInbox({ lang, sessionToken }: Props) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeResId, setActiveResId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const loadChats = useCallback(async () => {
    const res = await fetch("/api/admin/chat");
    if (res.ok) setChats((await res.json()).chats ?? []);
  }, []);

  const loadMessages = useCallback(async (resId: number) => {
    const res = await fetch(`/api/admin/chat?reservationId=${resId}`);
    if (res.ok) setMessages((await res.json()).messages ?? []);
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const wsHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const ws = new WebSocket(`ws://${wsHost}:3001?session=${sessionToken}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === "chat:message") {
        // Update chat list
        loadChats();
        // If in active conversation, add message
        if (msg.reservation_id === activeResId) {
          setMessages((prev) => [...prev, {
            id: msg.id,
            sender_type: msg.sender_type,
            sender_name: msg.sender_name,
            message: msg.message,
            is_read: true,
            created_at: msg.created_at,
          }]);
          // Mark as read
          ws.send(JSON.stringify({ type: "chat:read", reservationId: msg.reservation_id }));
        }
      }
      if (msg.type === "chat:typing" && msg.sender_type === "guest") {
        setTyping(msg.reservation_id);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(null), 2000);
      }
    };

    return () => ws.close();
  }, [sessionToken, activeResId, loadChats]);

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
    setActiveResId(resId);
    loadMessages(resId);
    wsRef.current?.send(JSON.stringify({ type: "chat:read", reservationId: resId }));
  }

  function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== 1 || !activeResId) return;
    wsRef.current.send(JSON.stringify({ type: "chat:send", text: trimmed, reservationId: activeResId }));
    setText("");
  }

  function handleKeyTyping() {
    if (wsRef.current?.readyState === 1 && activeResId) {
      wsRef.current.send(JSON.stringify({ type: "chat:typing", reservationId: activeResId }));
    }
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
            key={chat.reservation_id}
            onClick={() => openChat(chat.reservation_id)}
            className={`w-full border-b border-white/5 px-4 py-3 text-start transition hover:bg-white/5 ${
              activeResId === chat.reservation_id ? "bg-white/10" : ""
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
                    {typing === chat.reservation_id && (
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
              {typing === activeResId && (
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
              <div className="flex items-center gap-2">
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
