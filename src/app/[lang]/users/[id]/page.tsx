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
      subtitle={ctx.t("عرض بيانات المستخدم", "User details")}
    >
      {query.error ? (
        <p className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {query.error}
        </p>
      ) : null}
      {query.ok ? (
        <p className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {query.ok}
        </p>
      ) : null}

      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mx-auto relative h-32 w-32 overflow-hidden rounded-2xl border border-slate-300 bg-white">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name} fill className="object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-4xl font-bold text-blue-600">
                {profile.full_name.slice(0, 1)}
              </div>
            )}
          </div>
          <h2 className="mt-4 text-center text-xl font-semibold text-slate-900">{profile.full_name}</h2>
          <p className="mt-1 text-center text-sm text-slate-500">@{profile.username}</p>
          <p className="mt-2 text-center text-sm text-slate-600">
            {ctx.t("الأدوار", "Roles")}: {profileRoleNames.length ? profileRoleNames.join(", ") : "-"}
          </p>
          <p className="mt-1 text-center text-sm text-slate-600">
            {ctx.t("الحالة", "Status")}: {profile.is_active ? ctx.t("نشط", "Active") : ctx.t("موقوف", "Disabled")}
          </p>

          <div className="mt-5 flex justify-center">
            <Link
              href={`/${ctx.lang}/users/${profile.id}/edit`}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {ctx.t("تعديل المستخدم", "Edit User")}
            </Link>
          </div>
        </article>
      </section>
    </PanelShell>
  );
}
