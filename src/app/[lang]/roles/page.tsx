import { PanelShell } from "@/components/panel/panel-shell";
import { RolePermissionsDnd } from "@/components/panel/role-permissions-dnd";
import { RolesManagement } from "@/components/panel/roles-management";
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

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <RolesManagement
          lang={ctx.lang}
          returnTo={`/${ctx.lang}/roles`}
          roles={roles}
          selectedRoleId={selectedRole?.id}
          labels={{
            createRole: ctx.t("إضافة دور", "Create Role"),
            editRole: ctx.t("تعديل الدور", "Edit Role"),
            deleteRole: ctx.t("حذف الدور", "Delete Role"),
            roleName: ctx.t("اسم الدور", "Role name"),
            description: ctx.t("الوصف", "Description"),
            save: ctx.t("حفظ", "Save"),
            cancel: ctx.t("إلغاء", "Cancel"),
            openCreateModal: ctx.t("إضافة دور", "Create Role"),
            openEditModal: ctx.t("تعديل", "Edit"),
            openDeleteDialog: ctx.t("حذف", "Delete"),
            selectRoleToEdit: ctx.t("اختر دورا للتعديل", "Select role to edit"),
            confirmDeleteTitle: ctx.t("تأكيد حذف الدور", "Confirm Role Deletion"),
            confirmDeleteMessage: ctx.t(
              "هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع عن هذا الإجراء.",
              "Are you sure you want to delete this role? This action cannot be undone.",
            ),
            confirmDeleteButton: ctx.t("تأكيد الحذف", "Confirm Delete"),
          }}
        />

        <article className="rounded-2xl bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">
            {ctx.t("ترتيب صلاحيات الدور", "Role Permissions Order")}
            {selectedRole ? `: ${selectedRole.role_name}` : ""}
          </h2>
          {selectedRole ? (
            <div className="mt-4">
              <RolePermissionsDnd
                key={selectedRole.id}
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
            <p className="mt-4 text-sm text-white/50">{ctx.t("لا يوجد أدوار بعد", "No roles found")}</p>
          )}
        </article>
      </section>
    </PanelShell>
  );
}
