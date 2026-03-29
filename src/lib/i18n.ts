export type AppLang = "ar" | "en";

export function resolveLang(value: string | null | undefined): AppLang {
  return value === "en" ? "en" : "ar";
}

export function tr(lang: AppLang, ar: string, en: string): string {
  return lang === "ar" ? ar : en;
}

export function dirForLang(lang: AppLang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
