import Image from "next/image";
import { notFound } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { AvatarUploadForm } from "@/components/panel/avatar-upload-form";
import { PanelShell } from "@/components/panel/panel-shell";
import { getUserProfile } from "@/lib/data";
import { requirePanelContext } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function ProfilePage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);

  const profile = await getUserProfile(ctx.user.id);
  if (!profile) {
    notFound();
  }

  const profileRoleNames = Array.isArray(profile.roles) ? profile.roles : [];

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="profile"
      title={ctx.t("ملفي الشخصي", "My Profile")}
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

      <section className="mx-auto w-full max-w-6xl space-y-6">
        <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute -left-20 -bottom-24 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          </div>
          <div className="relative grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <article className="min-w-0 rounded-2xl bg-slate-900/50 p-4 shadow-lg">
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

              <div className="mt-4 space-y-2 rounded-xl bg-slate-900/70 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{ctx.t("الحالة", "Status")}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      profile.is_active
                        ? "bg-emerald-500/25 text-emerald-200"
                        : "bg-rose-500/25 text-rose-200"
                    }`}
                  >
                    {profile.is_active ? ctx.t("نشط", "Active") : ctx.t("موقوف", "Disabled")}
                  </span>
                </div>
                <div className="text-sm text-white/70">
                  <span className="text-white/60">{ctx.t("الأدوار", "Roles")}: </span>
                  {profileRoleNames.length ? profileRoleNames.join(", ") : "-"}
                </div>
              </div>

              <AvatarUploadForm
                lang={ctx.lang}
                userId={profile.id}
                returnTo={`/${ctx.lang}/profile`}
                chooseFileText={ctx.t("اختر ملف", "Choose File")}
                noFileText={ctx.t("لا يوجد ملف", "No file chosen")}
                uploadText={ctx.t("رفع الصورة", "Upload Avatar")}
              />
            </article>

            <article className="rounded-2xl bg-slate-900/50 p-5 shadow-lg">
              <h3 className="text-lg font-semibold text-white">{ctx.t("تحديث الملف الشخصي", "Update Profile")}</h3>
              <form action="/api/profile" method="post" className="mt-4 grid gap-4 md:grid-cols-2">
                <input type="hidden" name="lang" value={ctx.lang} />
                <input type="hidden" name="returnTo" value={`/${ctx.lang}/profile`} />

                <label className="grid gap-1.5 text-sm text-white/80 md:col-span-2">
                  <span>{ctx.t("الاسم الكامل", "Full name")}</span>
                  <input
                    name="fullName"
                    required
                    defaultValue={profile.full_name}
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:bg-white/15 focus:ring-2 focus:ring-cyan-400/50"
                  />
                </label>

                <label className="grid gap-1.5 text-sm text-white/80 md:col-span-2">
                  <span>{ctx.t("اسم المستخدم", "Username")}</span>
                  <input
                    value={profile.username}
                    readOnly
                    className="rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white/60"
                  />
                </label>

                <label className="grid gap-1.5 text-sm text-white/80 md:col-span-2">
                  <span>{ctx.t("كلمة مرور جديدة (اختياري)", "New password (optional)")}</span>
                  <input
                    name="password"
                    type="password"
                    placeholder={ctx.t("اتركه فارغًا إذا لا تريد التغيير", "Leave empty to keep current password")}
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:bg-white/15 focus:ring-2 focus:ring-cyan-400/50"
                  />
                </label>

                <p className="text-xs text-white/50 md:col-span-2">
                  {ctx.t(
                    "لا يمكن تعديل الأدوار أو حالة الحساب من هذه الصفحة",
                    "Roles and account status cannot be changed from this page",
                  )}
                </p>

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
