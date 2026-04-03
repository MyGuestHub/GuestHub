import Image from "next/image";
import { notFound } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { AvatarUploadForm } from "@/components/panel/avatar-upload-form";
import { PanelShell } from "@/components/panel/panel-shell";
import { getUserProfile, listRoles } from "@/lib/data";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function EditUserPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "users.manage", "dashboard");

  const userId = Number.parseInt(routeParams.id, 10);
  if (!Number.isFinite(userId)) notFound();

  const profile = await getUserProfile(userId);
  if (!profile) notFound();

  const roles = await listRoles();
  const profileRoleNames = Array.isArray(profile.roles) ? profile.roles : [];
  const selectedRoleIdSet = new Set<number>(Array.isArray(profile.role_ids) ? profile.role_ids : []);
  if (selectedRoleIdSet.size === 0 && profileRoleNames.length > 0) {
    for (const role of roles) {
      if (profileRoleNames.indexOf(role.role_name) !== -1) {
        selectedRoleIdSet.add(role.id);
      }
    }
  }

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="users"
      title={ctx.t("تعديل المستخدم", "Edit User")}
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

      <section className="mx-auto w-full max-w-6xl">
        <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          </div>

          <div className="relative grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <article className="min-w-0 rounded-2xl bg-slate-900/60 p-4 shadow-lg">
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
              <p className="mt-2 text-center text-sm text-white/70">
                {ctx.t("الأدوار", "Roles")}: {profileRoleNames.length ? profileRoleNames.join(", ") : "-"}
              </p>
              <p className="mt-1 text-center text-sm text-white/70">
                {ctx.t("الحالة", "Status")}: {profile.is_active ? ctx.t("نشط", "Active") : ctx.t("موقوف", "Disabled")}
              </p>

              <AvatarUploadForm
                lang={ctx.lang}
                userId={profile.id}
                returnTo={`/${ctx.lang}/users/${profile.id}/edit`}
                chooseFileText={ctx.t("اختر ملف", "Choose File")}
                noFileText={ctx.t("لا يوجد ملف", "No file chosen")}
                uploadText={ctx.t("رفع الصورة", "Upload Avatar")}
              />
            </article>

            <article className="rounded-2xl bg-slate-900/60 p-5 shadow-lg">
              <h3 className="text-lg font-semibold text-white">
                {ctx.t("تعديل بيانات المستخدم", "Edit User Information")}
              </h3>
              <form action={`/api/admin/users/${profile.id}`} method="post" className="mt-4 grid gap-3 md:grid-cols-2">
                <input type="hidden" name="lang" value={ctx.lang} />
                <input type="hidden" name="returnTo" value={`/${ctx.lang}/users/${profile.id}/edit`} />

                <label className="grid gap-1 text-sm text-white/80">
                  <span>{ctx.t("الاسم الكامل", "Full name")}</span>
                  <input
                    name="fullName"
                    required
                    defaultValue={profile.full_name}
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:bg-white/15 focus:ring-2 focus:ring-cyan-400/50"
                  />
                </label>

                <label className="grid gap-1 text-sm text-white/80">
                  <span>{ctx.t("اسم المستخدم", "Username")}</span>
                  <input
                    name="username"
                    required
                    defaultValue={profile.username}
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:bg-white/15 focus:ring-2 focus:ring-cyan-400/50"
                  />
                </label>

                <label className="grid gap-1 text-sm text-white/80 md:col-span-2">
                  <span>{ctx.t("كلمة مرور جديدة (اختياري)", "New password (optional)")}</span>
                  <input
                    name="password"
                    type="password"
                    placeholder={ctx.t("اتركه فارغًا إذا لا تريد التغيير", "Leave empty to keep current password")}
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:bg-white/15 focus:ring-2 focus:ring-cyan-400/50"
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-white/80 md:col-span-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={profile.is_active}
                    className="h-4 w-4 rounded border-white/30 bg-white/10 accent-cyan-500"
                  />
                  {ctx.t("الحساب نشط", "Account is active")}
                </label>

                {roles.length > 0 ? (
                  <fieldset className="md:col-span-2">
                    <legend className="mb-2 text-sm font-medium text-white/80">{ctx.t("الأدوار", "Roles")}</legend>
                    <div className="flex flex-wrap gap-3">
                      {roles.map((role) => (
                        <label
                          key={role.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80"
                        >
                          <input
                            type="checkbox"
                            name="roleIds"
                            value={role.id}
                            defaultChecked={selectedRoleIdSet.has(role.id)}
                            className="h-4 w-4 rounded border-white/30 bg-white/10 accent-cyan-500"
                          />
                          {role.role_name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : null}

                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 md:col-span-2">
                  <FiSave className="h-4 w-4" />
                  {ctx.t("حفظ التعديلات", "Save Changes")}
                </button>
              </form>
            </article>
          </div>
        </article>
      </section>
    </PanelShell>
  );
}
