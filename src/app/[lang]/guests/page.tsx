import { PanelShell } from "@/components/panel/panel-shell";
import { Pagination } from "@/components/panel/pagination";
import { hasPermission } from "@/lib/auth";
import { listGuestsPaginated } from "@/lib/data";
import { readPager, requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string; error?: string; ok?: string }>;
};

export default async function GuestsPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "occupancy.view", "dashboard");

  const pager = readPager(query, { pageSize: 10 });
  const guests = await listGuestsPaginated(pager.page, pager.pageSize);
  const canManage = hasPermission(ctx.user, "guests.manage");

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="guests"
      title={ctx.t("إدارة الضيوف", "Guest Management")}
      subtitle={ctx.t("تعريف الضيوف وربطهم بالحجوزات", "Register and track guests")}
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

      {canManage ? (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">{ctx.t("إضافة ضيف", "Add Guest")}</h2>
          <form action="/api/guests" method="post" className="mt-3 grid gap-3 md:grid-cols-5">
            <input type="hidden" name="lang" value={ctx.lang} />
            <input type="hidden" name="returnTo" value={`/${ctx.lang}/guests`} />
            <input
              name="firstName"
              required
              placeholder={ctx.t("الاسم الأول", "First name")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <input
              name="lastName"
              required
              placeholder={ctx.t("اسم العائلة", "Last name")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <input
              name="phone"
              placeholder={ctx.t("الهاتف", "Phone")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <input
              name="email"
              type="email"
              placeholder={ctx.t("البريد الإلكتروني", "Email")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              {ctx.t("حفظ", "Save")}
            </button>
          </form>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-slate-50 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">{ctx.t("الاسم", "Name")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("الهاتف", "Phone")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("البريد", "Email")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("الغرفة الحالية", "Current room")}</th>
                <th className="px-4 py-3 text-left">{ctx.t("الدخول/الخروج", "Check in/out")}</th>
                {canManage ? <th className="px-4 py-3 text-left">{ctx.t("إجراءات", "Actions")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {guests.rows.map((guest) => (
                <tr key={guest.id} className="border-t border-slate-200 text-slate-700">
                  <td className="px-4 py-3 font-medium">
                    {guest.first_name} {guest.last_name}
                  </td>
                  <td className="px-4 py-3">{guest.phone ?? "-"}</td>
                  <td className="px-4 py-3">{guest.email ?? "-"}</td>
                  <td className="px-4 py-3">{guest.room_number ?? "-"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {guest.check_in ? new Date(guest.check_in).toLocaleString() : "-"} /{" "}
                    {guest.check_out ? new Date(guest.check_out).toLocaleString() : "-"}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <form action="/api/guests" method="post" className="grid min-w-[520px] gap-2 md:grid-cols-2">
                          <input type="hidden" name="lang" value={ctx.lang} />
                          <input type="hidden" name="returnTo" value={`/${ctx.lang}/guests`} />
                          <input type="hidden" name="action" value="update" />
                          <input type="hidden" name="guestId" value={guest.id} />
                          <input
                            name="firstName"
                            required
                            defaultValue={guest.first_name}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                          />
                          <input
                            name="lastName"
                            required
                            defaultValue={guest.last_name}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                          />
                          <input
                            name="phone"
                            defaultValue={guest.phone ?? ""}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                          />
                          <input
                            name="email"
                            type="email"
                            defaultValue={guest.email ?? ""}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                          />
                          <div className="flex flex-wrap gap-2 md:col-span-2">
                            <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                              {ctx.t("حفظ", "Save")}
                            </button>
                          </div>
                        </form>
                        <form action="/api/guests" method="post">
                          <input type="hidden" name="lang" value={ctx.lang} />
                          <input type="hidden" name="returnTo" value={`/${ctx.lang}/guests`} />
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="guestId" value={guest.id} />
                          <button className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                            {ctx.t("حذف", "Delete")}
                          </button>
                        </form>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination
        lang={ctx.lang}
        basePath={`/${ctx.lang}/guests`}
        page={guests.pagination.page}
        pageSize={guests.pagination.pageSize}
        total={guests.pagination.total}
      />
    </PanelShell>
  );
}
