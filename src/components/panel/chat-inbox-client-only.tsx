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
    return <div className="h-[calc(100vh-120px)] rounded-2xl bg-slate-900/60" />;
  }

  return <ChatInbox lang={lang} sessionToken={sessionToken} />;
}
