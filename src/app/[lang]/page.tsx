import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { resolveLang } from "@/lib/i18n";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function LocalizedHomePage({ params }: Props) {
  const routeParams = await params;
  const lang = resolveLang(routeParams.lang);
  if (routeParams.lang !== lang) {
    redirect(`/${lang}`);
  }
  const user = await getCurrentUser();

  redirect(user ? `/${lang}/dashboard` : `/${lang}/login`);
}
