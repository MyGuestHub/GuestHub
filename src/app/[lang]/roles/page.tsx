import Link from "next/link";
import { PanelShell } from "@/components/panel/panel-shell";
import { RolePermissionsDnd } from "@/components/panel/role-permissions-dnd";
import { listPermissions, listRolePermissions, listRoles } from "@/lib/data";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ roleId?: string; error?: string; ok?: string }>;
};

export default async function RolesPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "roles.manage", "dashboard");

  const [roles, permissions] = await Promise.all([listRoles(), listPermissions()]);
  const selectedRoleIdRaw = Number.parseInt(query.roleId ?? String(roles[0]?.id ?? 0), 10);
  const selectedRoleId = Number.isFinite(selectedRoleIdRaw) ? selectedRoleIdRaw : roles[0]?.id ?? 0;
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];

  const assigned = selectedRole
    ? await listRolePermissions(selectedRole.id)
    : [];

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="roles"
      title={ctx.t("الأدوار والصلاحيات", "Roles & Permissions")}
      subtitle={ctx.t("إدارة دایناميكية للمستويات والصلاحيات", "Dynamic RBAC management")}
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

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">{ctx.t("إضافة دور", "Create Role")}</h2>
          <form action="/api/admin/roles" method="post" className="mt-3 space-y-3">
            <input type="hidden" name="lang" value={ctx.lang} />
            <input type="hidden" name="returnTo" value={`/${ctx.lang}/roles`} />
            <input type="hidden" name="action" value="create" />
            <input
              name="roleName"
              required
              placeholder={ctx.t("اسم الدور", "Role name")}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <input
              name="description"
              placeholder={ctx.t("الوصف", "Description")}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <button className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              {ctx.t("إنشاء الدور", "Create role")}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {ctx.t("اختر دورا للتعديل", "Select role to edit")}
            </p>
            {roles.map((role) => (
              <Link
                key={role.id}
                href={`/${ctx.lang}/roles?roleId=${role.id}`}
                className={`block rounded-xl border px-3 py-2 text-sm ${
                  selectedRole?.id === role.id
                    ? "border-cyan-400 bg-blue-600/15 text-blue-700"
                    : "border-slate-300 bg-slate-50 text-slate-700"
                }`}
              >
                <p className="font-medium">{role.role_name}</p>
                <p className="text-xs opacity-80">{role.description ?? "-"}</p>
              </Link>
            ))}
          </div>

          {selectedRole ? (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {ctx.t("تعديل الدور المحدد", "Edit selected role")}
              </h3>
              <form action="/api/admin/roles" method="post" className="mt-3 space-y-3">
                <input type="hidden" name="lang" value={ctx.lang} />
                <input type="hidden" name="returnTo" value={`/${ctx.lang}/roles?roleId=${selectedRole.id}`} />
                <input type="hidden" name="action" value="update" />
                <input type="hidden" name="roleId" value={selectedRole.id} />
                <input
                  name="roleName"
                  required
                  defaultValue={selectedRole.role_name}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                />
                <input
                  name="description"
                  defaultValue={selectedRole.description ?? ""}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                />
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                    {ctx.t("حفظ التعديلات", "Save changes")}
                  </button>
                </div>
              </form>
              <form action="/api/admin/roles" method="post" className="mt-2">
                <input type="hidden" name="lang" value={ctx.lang} />
                <input type="hidden" name="returnTo" value={`/${ctx.lang}/roles`} />
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="roleId" value={selectedRole.id} />
                <button className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                  {ctx.t("حذف الدور", "Delete role")}
                </button>
              </form>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {ctx.t("ترتيب صلاحيات الدور", "Role Permissions Order")}
            {selectedRole ? `: ${selectedRole.role_name}` : ""}
          </h2>
          {selectedRole ? (
            <div className="mt-3">
              <RolePermissionsDnd
                lang={ctx.lang}
                roleId={selectedRole.id}
                initialAssigned={assigned.map((item) => ({
                  permission_id: item.permission_id,
                  permission_code: item.permission_code,
                  description: item.description,
                }))}
                allPermissions={permissions}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">{ctx.t("لا يوجد أدوار بعد", "No roles found")}</p>
          )}
        </article>
      </section>
    </PanelShell>
  );
}
