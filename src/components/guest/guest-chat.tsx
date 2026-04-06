"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import { FiMessageCircle, FiSend, FiChevronDown, FiSmile } from "react-icons/fi";
import type { AppLang } from "@/lib/i18n";

type ChatMsg = {
  id: number;
  sender_type: "guest" | "staff";
  sender_name: string;
  message: string;
  created_at: string;
  is_read?: boolean;
};

type Props = {
  token: string;
  lang: AppLang;
  guestSessionToken: string;
};

export function GuestChat({ token, lang, guestSessionToken }: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const messagesRef = useRef<OverlayScrollbarsComponentRef>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const quickEmojis = ["😀", "😍", "🙏", "👍", "👌", "🎉", "❤️", "😊"];

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  // Load chat history via REST
  const loadHistory = useCallback(async (markRead = true) => {
    try {
      const res = await fetch(`/api/guest/chat?lang=${lang}&markRead=${markRead ? "1" : "0"}`);
      if (res.ok) {
        const data = await res.json();
        const normalized: ChatMsg[] = (data.messages ?? []).map((m: ChatMsg) => ({
          ...m,
          id: Number(m.id),
        }));
        setMessages(normalized);
        if (markRead) setUnread(0);
      }
    } catch {
      // Ignore transient network errors and keep current chat state.
    }
  }, [lang]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Connect WebSocket
  useEffect(() => {
    if (!mounted || !open) return;
    void loadHistory(true);

    let closedByEffect = false;

    const connect = () => {

    const wsBase = process.env.NEXT_PUBLIC_WS_URL
      || (window.location.protocol === "https:"
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname}:3001`);
    const wsUrl = `${wsBase}?token=${guestSessionToken}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttemptRef.current = 0;
    };
    ws.onclose = () => {
      setConnected(false);
      if (closedByEffect || !open) return;
      const delay = Math.min(1000 * (reconnectAttemptRef.current + 1), 5000);
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
    ws.onmessage = (evt) => {
      let msg: any;
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }
      if (msg.type === "chat:message") {
        setMessages((prev) => {
          const nextMsg: ChatMsg = {
            id: Number(msg.id),
            sender_type: msg.sender_type,
            sender_name: msg.sender_name,
            message: msg.message,
            created_at: msg.created_at,
            is_read: msg.sender_type === "staff" ? false : true,
          };
          return [...prev, nextMsg];
        });
        if (msg.sender_type === "staff") {
          ws.send(JSON.stringify({ type: "chat:read" }));
        }
      }
      if (msg.type === "chat:typing" && msg.sender_type === "staff") {
        setTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTyping(false), 2000);
      }
    };
    ws.onerror = () => {
      setConnected(false);
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
  }, [mounted, open, guestSessionToken, loadHistory]);

  // Auto-scroll — only scroll messages container
  useEffect(() => {
    const inst = messagesRef.current?.osInstance();
    if (inst) {
      const { viewport } = inst.elements();
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, typing]);

  // WS not open unread count via polling
  useEffect(() => {
    if (open) { setUnread(0); return; }
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/guest/chat?lang=${lang}&markRead=0`);
        if (res.ok) {
          const data = await res.json();
          const unreadStaff = (data.messages ?? []).filter(
            (m: ChatMsg) => m.sender_type === "staff" && !m.is_read,
          );
          setUnread(unreadStaff.length > 0 ? Math.min(unreadStaff.length, 99) : 0);
        }
      } catch {
        // Ignore transient network failures while polling.
      }
    }, 12000);
    return () => clearInterval(iv);
  }, [open, lang]);

  function addEmoji(emoji: string) {
    setText((prev) => `${prev}${emoji}`);
  }

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

  if (!mounted) return null;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 end-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition hover:scale-105 hover:from-cyan-400 hover:to-blue-500"
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
        <div className="fixed bottom-0 end-0 z-50 flex h-[480px] w-full max-w-sm flex-col rounded-t-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl sm:bottom-5 sm:end-5 sm:rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-3 text-white">
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
          <OverlayScrollbarsComponent
            ref={messagesRef}
            className="flex-1 overscroll-contain px-3 py-3"
            defer
            options={{
              scrollbars: { theme: "os-theme-light", autoHide: "move", autoHideDelay: 800 },
              overflow: { x: "hidden" },
            }}
          >
            <div className="space-y-2">
            {messages.length === 0 && (
              <p className="mt-10 text-center text-xs text-white/40">
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
                      ? "rounded-ee-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                      : "rounded-es-sm bg-white/10 text-white/90"
                  }`}
                >
                  {msg.sender_type === "staff" && (
                    <p className="mb-0.5 text-[10px] font-semibold text-cyan-400">{msg.sender_name || t("الاستقبال", "Reception")}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${
                      msg.sender_type === "guest" ? "text-white/60" : "text-white/40"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString(lang === "ar" ? "ar" : "en", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {msg.sender_type === "staff" && !msg.is_read && (
                    <span className="mt-1 inline-block rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                      {t("جديد", "New")}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {typing && (
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
            </div>
          </OverlayScrollbarsComponent>

          {/* Input */}
          <div className="border-t border-white/10 px-3 py-2">
            {emojiOpen && (
              <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-slate-800/60 p-2">
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
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-slate-800/60 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label={t("إيموجي", "Emoji")}
              >
                <FiSmile className="h-4 w-4" />
              </button>
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
                className="flex-1 rounded-xl border border-white/15 bg-slate-800/60 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40"
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
