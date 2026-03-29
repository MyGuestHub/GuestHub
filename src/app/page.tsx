import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveLang } from "@/lib/i18n";

function detectLangFromHeaders(acceptLanguage: string | null) {
  if (!acceptLanguage) return "ar";
  return acceptLanguage.toLowerCase().includes("en") ? "en" : "ar";
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const headerStore = await headers();
  const lang = resolveLang(detectLangFromHeaders(headerStore.get("accept-language")));
  redirect(user ? `/${lang}/dashboard` : `/${lang}/login`);
}
