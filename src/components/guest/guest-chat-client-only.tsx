"use client";

import { useEffect, useState } from "react";
import type { AppLang } from "@/lib/i18n";
import { GuestChat } from "@/components/guest/guest-chat";

type Props = {
  token: string;
  lang: AppLang;
  guestSessionToken: string;
};

export function GuestChatClientOnly({ token, lang, guestSessionToken }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <GuestChat token={token} lang={lang} guestSessionToken={guestSessionToken} />;
}
