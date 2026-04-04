"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiSend, FiX, FiChevronDown } from "react-icons/fi";
import type { AppLang } from "@/lib/i18n";

type ChatMsg = {
  id: number;
  sender_type: "guest" | "staff";
  sender_name: string;
  message: string;
  created_at: string;
};

type Props = {
  token: string;
  lang: AppLang;
  guestSessionToken: string;
};

export function GuestChat({ token, lang, guestSessionToken }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  // Load chat history via REST
  const loadHistory = useCallback(async () => {
    const res = await fetch(`/api/guest/chat?lang=${lang}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
  }, [lang]);

  // Connect WebSocket
  useEffect(() => {
    if (!open) return;
    loadHistory();

    const wsHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const wsUrl = `ws://${wsHost}:3001?token=${guestSessionToken}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === "chat:message") {
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            sender_type: msg.sender_type,
            sender_name: msg.sender_name,
            message: msg.message,
            created_at: msg.created_at,
          },
        ]);
        // Mark as read if chat is open
        ws.send(JSON.stringify({ type: "chat:read" }));
      }
      if (msg.type === "chat:typing" && msg.sender_type === "staff") {
        setTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTyping(false), 2000);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [open, guestSessionToken, loadHistory]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // WS not open unread count via polling
  useEffect(() => {
    if (open) { setUnread(0); return; }
    const iv = setInterval(async () => {
      const res = await fetch(`/api/guest/chat?lang=${lang}`);
      if (res.ok) {
        const data = await res.json();
        const staffMsgs = (data.messages ?? []).filter(
          (m: ChatMsg) => m.sender_type === "staff",
        );
        // Simple heuristic: count msgs since last open
        setUnread(staffMsgs.length > 0 ? Math.min(staffMsgs.length, 9) : 0);
      }
    }, 30000);
    return () => clearInterval(iv);
  }, [open, lang]);

  function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: "chat:send", text: trimmed }));
    setText("");
  }

  function handleTyping() {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: "chat:typing" }));
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 end-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:scale-105 hover:bg-blue-700"
        >
          <FiMessageCircle className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -end-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-0 end-0 z-50 flex h-[480px] w-full max-w-sm flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:bottom-5 sm:end-5 sm:rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-blue-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <FiMessageCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">{t("الدردشة مع الاستقبال", "Chat with Reception")}</p>
                <p className="text-[10px] opacity-80">
                  {connected
                    ? t("متصل", "Connected")
                    : t("جارٍ الاتصال…", "Connecting…")}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/20">
              <FiChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.length === 0 && (
              <p className="mt-10 text-center text-xs text-slate-400">
                {t("ابدأ المحادثة…", "Start a conversation…")}
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === "guest" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    msg.sender_type === "guest"
                      ? "rounded-ee-sm bg-blue-600 text-white"
                      : "rounded-es-sm bg-slate-100 text-slate-800"
                  }`}
                >
                  {msg.sender_type === "staff" && (
                    <p className="mb-0.5 text-[10px] font-semibold text-blue-500">{msg.sender_name || t("الاستقبال", "Reception")}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${
                      msg.sender_type === "guest" ? "text-white/60" : "text-slate-400"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString(lang === "ar" ? "ar" : "en", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-es-sm bg-slate-100 px-3 py-2 animate-pulse">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.1s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t("اكتب رسالتك…", "Type a message…")}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
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
        </div>
      )}
    </>
  );
}
