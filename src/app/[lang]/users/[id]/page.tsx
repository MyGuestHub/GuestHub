import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { AvatarUploadForm } from "@/components/panel/avatar-upload-form";
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
  if (!canManageUsers && userId !== ctx.user.id) {
    redirect(`/${ctx.lang}/dashboard?error=${encodeURIComponent(ctx.t("لا تملك صلاحية", "Access denied"))}`);
  }

  const profile = await getUserProfile(userId);
  if (!profile) notFound();

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="users"
      title={ctx.t("الملف الشخصي", "User Profile")}
      subtitle={ctx.t("رفع الصورة وإدارة بيانات المستخدم", "Avatar and account details")}
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

      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
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
              {ctx.t("الأدوار", "Roles")}: {profile.roles.length ? profile.roles.join(", ") : "-"}
            </p>
            <p className="mt-1 text-center text-sm text-slate-600">
              {ctx.t("الحالة", "Status")}:{" "}
              {profile.is_active ? ctx.t("نشط", "Active") : ctx.t("موقوف", "Disabled")}
            </p>

            <AvatarUploadForm
              lang={ctx.lang}
              userId={profile.id}
              returnTo={`/${ctx.lang}/users/${profile.id}`}
              chooseFileText={ctx.t("اختر ملف", "Choose File")}
              noFileText={ctx.t("لا يوجد ملف", "No file chosen")}
              uploadText={ctx.t("رفع الصورة", "Upload Avatar")}
            />
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {ctx.t("تعديل بيانات المستخدم", "Edit User Information")}
            </h3>
            <form action={`/api/admin/users/${profile.id}`} method="post" className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="lang" value={ctx.lang} />
              <input type="hidden" name="returnTo" value={`/${ctx.lang}/users/${profile.id}`} />

              <label className="grid gap-1 text-sm text-slate-700">
                <span>{ctx.t("الاسم الكامل", "Full name")}</span>
                <input
                  name="fullName"
                  required
                  defaultValue={profile.full_name}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                />
              </label>

              <label className="grid gap-1 text-sm text-slate-700">
                <span>{ctx.t("اسم المستخدم", "Username")}</span>
                <input
                  name="username"
                  required={canManageUsers}
                  defaultValue={profile.username}
                  readOnly={!canManageUsers}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    canManageUsers
                      ? "border-slate-300 bg-slate-50 text-slate-700"
                      : "border-slate-200 bg-slate-100 text-slate-500"
                  }`}
                />
              </label>

              <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">
                <span>{ctx.t("كلمة مرور جديدة (اختياري)", "New password (optional)")}</span>
                <input
                  name="password"
                  type="password"
                  placeholder={ctx.t("اتركه فارغًا إذا لا تريد التغيير", "Leave empty to keep current password")}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                />
              </label>

              {canManageUsers ? (
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={profile.is_active}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {ctx.t("الحساب نشط", "Account is active")}
                </label>
              ) : null}

              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2">
                <FiSave className="h-4 w-4" />
                {ctx.t("حفظ التعديلات", "Save Changes")}
              </button>
            </form>
          </article>
        </div>
      </section>
    </PanelShell>
  );
}
