import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { hasPermission } from "@/lib/auth";
import { PanelShell } from "@/components/panel/panel-shell";
import { getUserProfile } from "@/lib/data";
import { requirePanelContext } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function UserProfilePage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);

  const userId = Number.parseInt(routeParams.id, 10);
  if (!Number.isFinite(userId)) notFound();

  const canManageUsers = hasPermission(ctx.user, "users.manage");
  if (!canManageUsers && userId === ctx.user.id) {
    redirect(`/${ctx.lang}/profile`);
  }

  if (!canManageUsers) {
    redirect(`/${ctx.lang}/dashboard?error=${encodeURIComponent(ctx.t("لا تملك صلاحية", "Access denied"))}`);
  }

  const profile = await getUserProfile(userId);
  if (!profile) notFound();
  const profileRoleNames = Array.isArray(profile.roles) ? profile.roles : [];

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="users"
      title={ctx.t("الملف الشخصي", "User Profile")}
    >
      {query.error ? (
        <p className="mb-4 rounded-xl bg-rose-500/25 px-4 py-3 text-sm font-medium text-rose-100">
          {query.error}
        </p>
      ) : null}
      {query.ok ? (
        <p className="mb-4 rounded-xl bg-emerald-500/25 px-4 py-3 text-sm font-medium text-emerald-100">
          {query.ok}
        </p>
      ) : null}

      <section className="mx-auto w-full max-w-4xl">
        <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-xl rounded-2xl bg-slate-900/60 p-5">
            <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-2xl bg-slate-900/80">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name} fill className="object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-4xl font-bold text-cyan-100">
                {profile.full_name.slice(0, 1)}
              </div>
            )}
            </div>

            <h2 className="mt-4 text-center text-xl font-semibold text-white">{profile.full_name}</h2>
            <p className="mt-1 text-center text-sm text-white/60">@{profile.username}</p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-900/70 p-3 text-sm text-white/80">
              <p>
                <span className="text-white/60">{ctx.t("الأدوار", "Roles")}: </span>
                {profileRoleNames.length ? profileRoleNames.join(", ") : "-"}
              </p>
              <p>
                <span className="text-white/60">{ctx.t("الحالة", "Status")}: </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    profile.is_active ? "bg-emerald-500/25 text-emerald-200" : "bg-rose-500/25 text-rose-200"
                  }`}
                >
                  {profile.is_active ? ctx.t("نشط", "Active") : ctx.t("موقوف", "Disabled")}
                </span>
              </p>
            </div>

            <div className="mt-5 flex justify-center">
              <Link
                href={`/${ctx.lang}/users/${profile.id}/edit`}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {ctx.t("تعديل المستخدم", "Edit User")}
              </Link>
            </div>
          </div>
        </article>
      </section>
    </PanelShell>
  );
}
