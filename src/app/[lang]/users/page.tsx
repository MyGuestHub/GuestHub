import Link from "next/link";
import { PanelShell } from "@/components/panel/panel-shell";
import { Pagination } from "@/components/panel/pagination";
import { listRoles, listUsersPaginated } from "@/lib/data";
import { readPager, requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string; error?: string; ok?: string }>;
};

export default async function UsersPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "users.manage", "dashboard");

  const pager = readPager(query, { pageSize: 10 });
  const [users, roles] = await Promise.all([
    listUsersPaginated(pager.page, pager.pageSize),
    listRoles(),
  ]);

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="users"
      title={ctx.t("إدارة المستخدمين", "Users Management")}
      subtitle={ctx.t("إنشاء المستخدمين وربطهم بالأدوار", "Create users and assign roles")}
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

      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">{ctx.t("إضافة مستخدم", "Add User")}</h2>
          <form action="/api/admin/users" method="post" className="mt-3 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="lang" value={ctx.lang} />
            <input type="hidden" name="returnTo" value={`/${ctx.lang}/users`} />
            <input
              name="fullName"
              required
              placeholder={ctx.t("الاسم الكامل", "Full name")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <input
              name="username"
              required
              placeholder={ctx.t("اسم المستخدم", "Username")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <input
              name="password"
              required
              type="password"
              placeholder={ctx.t("كلمة المرور (8+)", "Password (8+)")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 md:col-span-2"
            />
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2">
              {ctx.t("إضافة", "Create")}
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">{ctx.t("تعيين دور", "Assign Role")}</h2>
          <form action="/api/admin/user-roles" method="post" className="mt-3 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="lang" value={ctx.lang} />
            <input type="hidden" name="returnTo" value={`/${ctx.lang}/users`} />
            <select
              name="userId"
              required
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <option value="">{ctx.t("اختر مستخدم", "Select user")}</option>
              {users.rows.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
            <select
              name="roleId"
              required
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <option value="">{ctx.t("اختر دور", "Select role")}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2">
              {ctx.t("حفظ الدور", "Assign")}
            </button>
          </form>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">{ctx.t("المستخدم", "User")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("الاسم", "Full name")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("الأدوار", "Roles")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("الحالة", "Status")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("إجراء", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {users.rows.map((user) => (
                <tr key={user.id} className="border-t border-slate-200 text-slate-700">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/${ctx.lang}/users/${user.id}`} className="text-blue-600 hover:text-blue-700">
                      {user.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{user.full_name}</td>
                  <td className="px-4 py-3">{user.roles.length ? user.roles.join(", ") : "-"}</td>
                  <td className="px-4 py-3">
                    {user.is_active ? ctx.t("نشط", "Active") : ctx.t("موقوف", "Disabled")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${ctx.lang}/users/${user.id}/edit`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {ctx.t("تعديل", "Edit")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination
        lang={ctx.lang}
        basePath={`/${ctx.lang}/users`}
        page={users.pagination.page}
        pageSize={users.pagination.pageSize}
        total={users.pagination.total}
      />
    </PanelShell>
  );
}
