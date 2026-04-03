"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiPlus, FiSearch, FiShield, FiEdit2, FiTrash2, FiCheck, FiKey } from "react-icons/fi";
import type { RoleOption } from "@/lib/data";
import { AppModal } from "@/components/ui/app-modal";

type Labels = {
  createRole: string;
  editRole: string;
  deleteRole: string;
  roleName: string;
  description: string;
  save: string;
  cancel: string;
  openCreateModal: string;
  openEditModal: string;
  openDeleteDialog: string;
  selectRoleToEdit: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmDeleteButton: string;
};

type Props = {
  lang: string;
  returnTo: string;
  roles: RoleOption[];
  selectedRoleId?: number;
  labels: Labels;
};

export function RolesManagement({ lang, returnTo, roles, selectedRoleId, labels }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? roles[0] ?? null,
    [roles, selectedRoleId],
  );

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (role) =>
        role.role_name.toLowerCase().includes(q) ||
        (role.description?.toLowerCase().includes(q) ?? false),
    );
  }, [roles, searchQuery]);

  return (
    <article className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("بحث عن دور...", "Search roles...")}
            className="w-full rounded-xl border border-white/20 bg-slate-900/40 py-2.5 pe-4 ps-10 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-cyan-400/60 focus:bg-slate-900/50 focus:ring-2 focus:ring-cyan-400/30"
          />
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500/35 to-teal-500/35 px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          <FiPlus className="h-4 w-4" />
          {labels.openCreateModal}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-blue-500/25 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/40 p-2.5">
              <FiShield className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{roles.length}</p>
              <p className="text-xs text-white/60">{t("إجمالي الأدوار", "Total Roles")}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/25 to-orange-500/25 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/40 p-2.5">
              <FiKey className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{filteredRoles.length}</p>
              <p className="text-xs text-white/60">{t("نتائج البحث", "Matching")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles list */}
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.06] shadow-2xl backdrop-blur-xl">
        <div className="divide-y divide-white/10">
          {filteredRoles.length === 0 ? (
            <div className="p-6 text-center text-white/60 text-sm">
              {t("لا توجد أدوار مطابقة", "No matching roles found")}
            </div>
          ) : (
            filteredRoles.map((role) => (
              <Link
                key={role.id}
                href={`/${lang}/roles?roleId=${role.id}`}
                className={`flex items-center justify-between px-4 py-3.5 transition hover:bg-white/[0.08] ${
                  selectedRole?.id === role.id ? "bg-white/[0.10]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      selectedRole?.id === role.id ? "bg-cyan-400/30" : "bg-slate-900/40"
                    }`}
                  >
                    <FiShield
                      className={`h-4 w-4 ${
                        selectedRole?.id === role.id ? "text-cyan-200" : "text-white/60"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white">{role.role_name}</p>
                    <p className="text-xs text-white/50">{role.description || "-"}</p>
                  </div>
                </div>
                {selectedRole?.id === role.id && (
                  <FiCheck className="h-5 w-5 text-cyan-300" />
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Action buttons for selected role */}
      {selectedRole && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
          >
            <FiEdit2 className="h-4 w-4" />
            {labels.openEditModal}
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
          >
            <FiTrash2 className="h-4 w-4" />
            {labels.openDeleteDialog}
          </button>
        </div>
      )}

      {/* Create Modal */}
      <AppModal open={createOpen} onClose={() => setCreateOpen(false)} title={labels.createRole} closeLabel={labels.cancel}>
        <form action="/api/admin/roles" method="post" className="mt-4 space-y-4">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="action" value="create" />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.roleName}</span>
            <input
              name="roleName"
              required
              className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none transition"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.description}</span>
            <input
              name="description"
              className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none transition"
            />
          </label>
          <div className="flex justify-end pt-2">
            <button className="rounded-xl bg-emerald-500/85 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
              {labels.save}
            </button>
          </div>
        </form>
      </AppModal>

      {/* Edit Modal */}
      <AppModal
        open={editOpen && Boolean(selectedRole)}
        onClose={() => setEditOpen(false)}
        title={labels.editRole}
        closeLabel={labels.cancel}
      >
        {selectedRole && (
          <form action="/api/admin/roles" method="post" className="mt-4 space-y-4">
            <input type="hidden" name="lang" value={lang} />
            <input type="hidden" name="returnTo" value={`/${lang}/roles?roleId=${selectedRole.id}`} />
            <input type="hidden" name="action" value="update" />
            <input type="hidden" name="roleId" value={selectedRole.id} />
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.roleName}</span>
              <input
                name="roleName"
                required
                defaultValue={selectedRole.role_name}
                className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none transition"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.description}</span>
              <input
                name="description"
                defaultValue={selectedRole.description ?? ""}
                className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none transition"
              />
            </label>
            <div className="flex justify-end pt-2">
              <button className="rounded-xl bg-cyan-500/85 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500">
                {labels.save}
              </button>
            </div>
          </form>
        )}
      </AppModal>

      {/* Delete Modal */}
      <AppModal
        open={deleteOpen && Boolean(selectedRole)}
        onClose={() => setDeleteOpen(false)}
        title={labels.confirmDeleteTitle}
        maxWidthClass="max-w-md"
        closeLabel={labels.cancel}
      >
        {selectedRole && (
          <>
            <p className="text-sm text-white/80">
              {labels.confirmDeleteMessage}{" "}
              <span className="font-semibold text-white">{selectedRole.role_name}</span>
            </p>
            <div className="mt-6 flex justify-end">
              <form action="/api/admin/roles" method="post">
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="returnTo" value={`/${lang}/roles`} />
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="roleId" value={selectedRole.id} />
                <button className="rounded-xl bg-rose-500/85 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500">
                  {labels.confirmDeleteButton}
                </button>
              </form>
            </div>
          </>
        )}
      </AppModal>
    </article>
  );
}
