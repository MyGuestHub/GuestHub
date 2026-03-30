"use client";

import { useEffect } from "react";

type Props = { lang: "ar" | "en" };

export function HtmlDirSetter({ lang }: Props) {
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return null;
}
