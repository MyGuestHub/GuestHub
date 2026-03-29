import { redirect } from "next/navigation";
import { resolveLang } from "@/lib/i18n";

type Props = {
  searchParams: Promise<{ lang?: string; error?: string; ok?: string }>;
};

export default async function LegacyLoginRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const lang = resolveLang(params.lang);
  const qs = new URLSearchParams();
  if (params.error) qs.set("error", params.error);
  if (params.ok) qs.set("ok", params.ok);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/${lang}/login${suffix}`);
}
