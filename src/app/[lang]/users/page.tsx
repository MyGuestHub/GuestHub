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
        <p className="mb-4 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-100 backdrop-blur-sm">
          {query.error}
        </p>
      )}
      {query.ok && (
        <p className="mb-4 rounded-xl bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100 backdrop-blur-sm">
          {query.ok}
        </p>
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
