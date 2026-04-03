"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiPlus,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiEdit2,
  FiX,
  FiUsers,
  FiKey,
} from "react-icons/fi";
import type { RoleOption, StaffUser } from "@/lib/data";
import { AppModal } from "@/components/ui/app-modal";
import { AppSelect } from "@/components/ui/app-select";

type Labels = {
  addUser: string;
  assignRole: string;
  fullName: string;
  username: string;
  password: string;
  selectUser: string;
  selectRole: string;
  create: string;
  saveRole: string;
  cancel: string;
};

type Props = {
  lang: string;
  returnTo: string;
  users: StaffUser[];
  roles: RoleOption[];
  labels: Labels;
};

function getInitials(fullName: string): string {
  const parts = fullName.split(" ");
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
}

export function UsersManagement({ lang, returnTo, users, roles, labels }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.roles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "disabled" && !user.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      disabled: users.filter((u) => !u.is_active).length,
      withRoles: users.filter((u) => u.roles.length > 0).length,
    };
  }, [users]);

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER: Search & Actions
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("البحث عن مستخدم...", "Search users...")}
            className="w-full rounded-xl bg-slate-900/60 py-2.5 pe-4 ps-10 text-sm text-white placeholder-white/50 outline-none transition focus:bg-slate-900/70"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500/40 px-4 py-2.5 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-500/50"
          >
            <FiKey className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.assignRole}</span>
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/40 px-4 py-2.5 text-sm font-semibold text-emerald-100 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500/50"
          >
            <FiPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.addUser}</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STATS ROW
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`group flex items-center gap-3 rounded-xl border p-3 transition ${
            statusFilter === "all"
              ? "border-violet-400/50 bg-violet-500/30 shadow-lg"
              : "border-white/20 bg-slate-900/50 hover:bg-slate-900/70"
          }`}
        >
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-500/30 shadow-md">
            <FiUsers className="h-5 w-5 text-white" />
          </div>
          <div className="text-start">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/60">{t("إجمالي المستخدمين", "Total Users")}</p>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
          className={`group flex items-center gap-3 rounded-xl border p-3 transition ${
            statusFilter === "active"
              ? "border-emerald-400/50 bg-emerald-500/30 shadow-lg"
              : "border-white/20 bg-slate-900/50 hover:bg-slate-900/70"
          }`}
        >
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/30 shadow-md">
            <FiUserCheck className="h-5 w-5 text-white" />
          </div>
          <div className="text-start">
            <p className="text-2xl font-bold text-white">{stats.active}</p>
            <p className="text-xs text-white/60">{t("نشطين", "Active")}</p>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "disabled" ? "all" : "disabled")}
          className={`group flex items-center gap-3 rounded-xl border p-3 transition ${
            statusFilter === "disabled"
              ? "border-rose-400/50 bg-rose-500/30 shadow-lg"
              : "border-white/20 bg-slate-900/50 hover:bg-slate-900/70"
          }`}
        >
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-500/30 shadow-md">
            <FiUserX className="h-5 w-5 text-white" />
          </div>
          <div className="text-start">
            <p className="text-2xl font-bold text-white">{stats.disabled}</p>
            <p className="text-xs text-white/60">{t("معطلين", "Disabled")}</p>
          </div>
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/20 p-3 shadow-lg">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/30 shadow-md">
            <FiShield className="h-5 w-5 text-white" />
          </div>
          <div className="text-start">
            <p className="text-2xl font-bold text-white">{stats.withRoles}</p>
            <p className="text-xs text-white/60">{t("بأدوار", "With Roles")}</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          USERS TABLE
      ═══════════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-2xl bg-slate-900/60 shadow-lg">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiSearch className="mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm text-white/50">
              {searchQuery || statusFilter !== "all"
                ? t("لا توجد نتائج مطابقة", "No matching results")
                : t("لا يوجد مستخدمين", "No users yet")}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-3 text-sm text-teal-400 hover:underline"
              >
                {t("مسح البحث والفلاتر", "Clear search and filters")}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-white/20 bg-slate-900/50 text-xs uppercase tracking-wide text-white/70">
                  <th className="px-4 py-3 text-start font-medium">{t("المستخدم", "User")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("الاسم الكامل", "Full Name")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("الأدوار", "Roles")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("الحالة", "Status")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("إجراءات", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="group transition hover:bg-slate-900/50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 ring-2 shadow-md">
                          <span className="text-xs font-bold text-white">
                            {getInitials(user.full_name)}
                          </span>
                        </div>
                        <Link
                          href={`/${lang}/users/${user.id}`}
                          className="font-medium text-white hover:text-cyan-400 transition"
                        >
                          {user.username}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-white/90">{user.full_name}</td>
                    <td className="px-4 py-3.5">
                      {user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-full bg-cyan-500/30 px-2 py-0.5 text-xs font-medium text-cyan-100"
                            >
                              <FiShield className="h-3 w-3" />
                              {role}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/40 px-2.5 py-1 text-xs font-medium text-emerald-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {t("نشط", "Active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/40 px-2.5 py-1 text-xs font-medium text-rose-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                          {t("معطل", "Disabled")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/${lang}/users/${user.id}`}
                          className="rounded-lg p-2 text-white/70 transition hover:bg-slate-900/60 hover:text-cyan-400"
                          title={t("تعديل", "Edit")}
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════ */}

      {/* Add User Modal */}
      <AppModal open={addOpen} onClose={() => setAddOpen(false)} title={labels.addUser} closeLabel={labels.cancel}>
        <form action="/api/admin/users" method="post" className="mt-4 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.fullName}</span>
            <input
              name="fullName"
              required
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.username}</span>
            <input
              name="username"
              required
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.password}</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
            />
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-xl bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-slate-900/80"
            >
              {labels.cancel}
            </button>
            <button className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400">
              {labels.create}
            </button>
          </div>
        </form>
      </AppModal>

      {/* Assign Role Modal */}
      <AppModal open={assignOpen} onClose={() => setAssignOpen(false)} title={labels.assignRole} closeLabel={labels.cancel}>
        <form action="/api/admin/user-roles" method="post" className="mt-4 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.selectUser}</span>
            <AppSelect name="userId" required>
              <option value="" className="text-slate-900">{labels.selectUser}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="text-slate-900">
                  {user.username} ({user.full_name})
                </option>
              ))}
            </AppSelect>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.selectRole}</span>
            <AppSelect name="roleId" required>
              <option value="" className="text-slate-900">{labels.selectRole}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id} className="text-slate-900">
                  {role.role_name}
                </option>
              ))}
            </AppSelect>
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="rounded-xl bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-slate-900/80"
            >
              {labels.cancel}
            </button>
            <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400">
              {labels.saveRole}
            </button>
          </div>
        </form>
      </AppModal>
    </div>
  );
}
