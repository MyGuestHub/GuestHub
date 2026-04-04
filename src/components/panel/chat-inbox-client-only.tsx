"use client";

import { useEffect, useState } from "react";
import { ChatInbox } from "@/components/panel/chat-inbox";

type Props = {
  lang: string;
  sessionToken: string;
};

export function ChatInboxClientOnly({ lang, sessionToken }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[calc(100dvh-7rem)] rounded-2xl border border-white/[0.06] bg-slate-900/40" />;
  }

  return <ChatInbox lang={lang} sessionToken={sessionToken} />;
}
