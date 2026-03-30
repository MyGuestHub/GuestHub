import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { dirForLang, resolveLang, tr } from "@/lib/i18n";
import { HtmlDirSetter } from "@/components/html-dir-setter";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    error?: string;
    ok?: string;
  }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const lang = resolveLang(routeParams.lang);
  if (routeParams.lang !== lang) {
    redirect(`/${lang}/login`);
  }

  const user = await getCurrentUser();
  if (user) redirect(`/${lang}/dashboard`);

  return (
    <main
      dir={dirForLang(lang)}
      className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"
    >
      <HtmlDirSetter lang={lang} />
      <section className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="mb-4 flex items-center justify-end gap-2 text-sm">
          <Link
            href="/ar/login"
            className={`rounded-lg px-3 py-1 ${lang === "ar" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            العربية
          </Link>
          <Link
            href="/en/login"
            className={`rounded-lg px-3 py-1 ${lang === "en" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            English
          </Link>
        </div>

        <h1 className="text-2xl font-bold">
          {tr(lang, "تسجيل دخول موظفي الفندق", "Hotel Staff Login")}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {tr(
            lang,
            "لوحة إدارة الضيوف والغرف والحجوزات",
            "Management panel for guests, rooms, and reservations",
          )}
        </p>

        {query.error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {query.error}
          </p>
        ) : null}

        {query.ok ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {query.ok}
          </p>
        ) : null}

        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="lang" value={lang} />

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              {tr(lang, "اسم المستخدم", "Username")}
            </span>
            <input
              name="username"
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-slate-500"
              placeholder="admin"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              {tr(lang, "كلمة المرور", "Password")}
            </span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-slate-500"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            {tr(lang, "دخول", "Sign in")}
          </button>
        </form>
      </section>
    </main>
  );
}
