import { PanelShell } from "@/components/panel/panel-shell";
import { UsersManagement } from "@/components/panel/users-management";
import { listRoles, listUsersWithRoles } from "@/lib/data";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function UsersPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "users.manage", "dashboard");

  const [users, roles] = await Promise.all([listUsersWithRoles(), listRoles()]);

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="users"
      title={ctx.t("إدارة المستخدمين", "Users Management")}
    >
      {query.error && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20">
            <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-rose-200">{query.error}</p>
        </div>
      )}
      {query.ok && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-200">{query.ok}</p>
        </div>
      )}

      <UsersManagement
        lang={ctx.lang}
        returnTo={`/${ctx.lang}/users`}
        users={users}
        roles={roles}
        labels={{
          addUser: ctx.t("إضافة مستخدم", "Add User"),
          assignRole: ctx.t("تعيين دور", "Assign Role"),
          fullName: ctx.t("الاسم الكامل", "Full name"),
          username: ctx.t("اسم المستخدم", "Username"),
          password: ctx.t("كلمة المرور (8+)", "Password (8+)"),
          selectUser: ctx.t("اختر مستخدم", "Select user"),
          selectRole: ctx.t("اختر دور", "Select role"),
          create: ctx.t("إضافة", "Create"),
          saveRole: ctx.t("حفظ الدور", "Assign"),
          cancel: ctx.t("إلغاء", "Cancel"),
        }}
      />
    </PanelShell>
  );
}
