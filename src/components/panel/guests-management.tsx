"use client";

import { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiUser,
  FiPhone,
  FiMail,
  FiHome,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUsers,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import type { GuestWithRoom } from "@/lib/data";
import { AppModal } from "@/components/ui/app-modal";

type Labels = {
  addGuest: string;
  editGuest: string;
  deleteGuest: string;
  save: string;
  cancel: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  actions: string;
  name: string;
  currentRoom: string;
  checkInOut: string;
  openAddModal: string;
  openEditModal: string;
  openDeleteDialog: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmDeleteButton: string;
};

type Props = {
  lang: string;
  returnTo: string;
  guests: GuestWithRoom[];
  canManage: boolean;
  labels: Labels;
};

function formatDate(value: string, lang: string) {
  const d = new Date(value);
  return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const d = new Date(value);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function GuestsManagement({ lang, returnTo, guests, canManage, labels }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<GuestWithRoom | null>(null);
  const [deleteGuest, setDeleteGuest] = useState<GuestWithRoom | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "checked_in" | "checked_out">("all");

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  // Filter guests based on search and status
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const fullName = `${guest.first_name} ${guest.last_name}`.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        fullName.includes(searchQuery.toLowerCase()) ||
        guest.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.room_number?.toLowerCase().includes(searchQuery.toLowerCase());

      const isCheckedIn = guest.check_in && !guest.check_out;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "checked_in" && isCheckedIn) ||
        (statusFilter === "checked_out" && guest.check_out);

      return matchesSearch && matchesStatus;
    });
  }, [guests, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const checkedIn = guests.filter((g) => g.check_in && !g.check_out).length;
    const checkedOut = guests.filter((g) => g.check_out).length;
    return {
      total: guests.length,
      checkedIn,
      checkedOut,
    };
  }, [guests]);

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER: Search & Add Button
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("البحث عن ضيف...", "Search guests...")}
            className="w-full rounded-xl border border-white/20 bg-slate-900/40 py-2.5 pe-4 ps-10 text-sm text-white placeholder-white/50 outline-none transition focus:border-cyan-400/60 focus:bg-slate-900/50 focus:ring-2 focus:ring-cyan-400/30"
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

        {canManage && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500/35 to-teal-500/35 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:brightness-110"
          >
            <FiPlus className="h-4 w-4" />
            <span>{labels.openAddModal}</span>
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STATS ROW
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />
        </div>
        <div className="relative grid grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter(statusFilter === "all" ? "all" : "all")}
          className={`group flex items-center gap-3 rounded-2xl border p-4 transition ${
            statusFilter === "all"
              ? "border-violet-400/40 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/25"
              : "border-white/15 bg-slate-900/40 hover:bg-slate-900/60"
          }`}
        >
          <div className={`rounded-xl p-2.5 ${statusFilter === "all" ? "bg-violet-500/40" : "bg-slate-900/60"}`}>
            <FiUsers className={`h-5 w-5 ${statusFilter === "all" ? "text-violet-300" : "text-white/60"}`} />
          </div>
          <div className="text-start">
            <p className="text-2xl font-bold tracking-tight text-white">{stats.total}</p>
            <p className="text-xs text-white/60">{t("إجمالي الضيوف", "Total Guests")}</p>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "checked_in" ? "all" : "checked_in")}
          className={`group flex items-center gap-3 rounded-2xl border p-4 transition ${
            statusFilter === "checked_in"
              ? "border-emerald-400/40 bg-gradient-to-br from-emerald-500/25 to-teal-500/25"
              : "border-white/15 bg-slate-900/40 hover:bg-slate-900/60"
          }`}
        >
          <div className={`rounded-xl p-2.5 ${statusFilter === "checked_in" ? "bg-emerald-500/40" : "bg-slate-900/60"}`}>
            <FiUserCheck className={`h-5 w-5 ${statusFilter === "checked_in" ? "text-emerald-300" : "text-white/60"}`} />
          </div>
          <div className="text-start">
            <p className="text-2xl font-bold tracking-tight text-white">{stats.checkedIn}</p>
            <p className="text-xs text-white/60">{t("مسجلين حاليًا", "Checked In")}</p>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "checked_out" ? "all" : "checked_out")}
          className={`group flex items-center gap-3 rounded-2xl border p-4 transition ${
            statusFilter === "checked_out"
              ? "border-amber-400/40 bg-gradient-to-br from-amber-500/25 to-orange-500/25"
              : "border-white/15 bg-slate-900/40 hover:bg-slate-900/60"
          }`}
        >
          <div className={`rounded-xl p-2.5 ${statusFilter === "checked_out" ? "bg-amber-500/40" : "bg-slate-900/60"}`}>
            <FiUserX className={`h-5 w-5 ${statusFilter === "checked_out" ? "text-amber-300" : "text-white/60"}`} />
          </div>
          <div className="text-start">
            <p className="text-2xl font-bold tracking-tight text-white">{stats.checkedOut}</p>
            <p className="text-xs text-white/60">{t("غادروا", "Checked Out")}</p>
          </div>
        </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          GUESTS TABLE
      ═══════════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.06] shadow-2xl backdrop-blur-xl">
        {filteredGuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiSearch className="mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm text-white/50">
              {searchQuery || statusFilter !== "all"
                ? t("لا توجد نتائج مطابقة", "No matching results")
                : t("لا يوجد ضيوف", "No guests yet")}
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
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-white/15 bg-slate-900/40">
                  <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{labels.name}</th>
                  <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{labels.phone}</th>
                  <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{labels.email}</th>
                  <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{labels.currentRoom}</th>
                  <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{labels.checkInOut}</th>
                  <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("الحالة", "Status")}</th>
                  {canManage && <th className="px-4 py-4 text-end text-xs font-semibold uppercase tracking-wider text-white/70">{labels.actions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredGuests.map((guest) => {
                  const isCheckedIn = guest.check_in && !guest.check_out;
                  return (
                    <tr key={guest.id} className="group transition-colors hover:bg-white/[0.08]">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500/50 to-purple-500/50 ring-2 shadow-md">
                            <span className="text-xs font-bold text-white">
                              {getInitials(guest.first_name, guest.last_name)}
                            </span>
                          </div>
                          <span className="font-medium text-white">
                            {guest.first_name} {guest.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {guest.phone ? (
                          <div className="flex items-center gap-2 text-white/90">
                            <FiPhone className="h-3.5 w-3.5 text-white/50" />
                            <span>{guest.phone}</span>
                          </div>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {guest.email ? (
                          <div className="flex items-center gap-2 text-white/90">
                            <FiMail className="h-3.5 w-3.5 text-white/50" />
                            <span className="max-w-[180px] truncate">{guest.email}</span>
                          </div>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {guest.room_number ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/70 px-2.5 py-1 text-sm font-semibold text-white shadow-sm">
                            <FiHome className="h-3.5 w-3.5" />
                            #{guest.room_number}
                          </span>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {guest.check_in ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-white/70">
                              <FiCalendar className="h-3 w-3" />
                              <span>{formatDate(guest.check_in, lang)}</span>
                              <span className="text-white/40">{formatTime(guest.check_in)}</span>
                            </div>
                            {guest.check_out && (
                              <div className="flex items-center gap-1.5 text-xs text-white/50">
                                <span className="text-white/30">→</span>
                                <span>{formatDate(guest.check_out, lang)}</span>
                                <span className="text-white/30">{formatTime(guest.check_out)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/40 px-2.5 py-1 text-xs font-medium text-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {t("مسجل", "Checked In")}
                          </span>
                        ) : guest.check_out ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/40 px-2.5 py-1 text-xs font-medium text-amber-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            {t("غادر", "Checked Out")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-white/70">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                            {t("جديد", "New")}
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditGuest(guest)}
                              className="rounded-lg p-2 text-white/70 transition hover:bg-slate-900/60 hover:text-cyan-400"
                              title={labels.openEditModal}
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteGuest(guest)}
                              className="rounded-lg p-2 text-white/70 transition hover:bg-slate-900/60 hover:text-rose-400"
                              title={labels.openDeleteDialog}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════ */}

      {/* Add Guest Modal */}
      <AppModal open={addOpen} onClose={() => setAddOpen(false)} title={labels.addGuest} closeLabel={labels.cancel}>
        <form action="/api/guests" method="post" className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.firstName}</span>
            <input
              name="firstName"
              required
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.lastName}</span>
            <input
              name="lastName"
              required
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.phone}</span>
            <input
              name="phone"
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.email}</span>
            <input
              name="email"
              type="email"
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
            />
          </label>
          <div className="col-span-full mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-xl bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-slate-900/80"
            >
              {labels.cancel}
            </button>
            <button className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400">
              {labels.save}
            </button>
          </div>
        </form>
      </AppModal>

      {/* Edit Guest Modal */}
      <AppModal
        open={Boolean(editGuest)}
        onClose={() => setEditGuest(null)}
        title={labels.editGuest}
        closeLabel={labels.cancel}
      >
        {editGuest ? (
          <form action="/api/guests" method="post" className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="lang" value={lang} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="action" value="update" />
            <input type="hidden" name="guestId" value={editGuest.id} />
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.firstName}</span>
              <input
                name="firstName"
                required
                defaultValue={editGuest.first_name}
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.lastName}</span>
              <input
                name="lastName"
                required
                defaultValue={editGuest.last_name}
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.phone}</span>
              <input
                name="phone"
                defaultValue={editGuest.phone ?? ""}
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.email}</span>
              <input
                name="email"
                type="email"
                defaultValue={editGuest.email ?? ""}
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
              />
            </label>
            <div className="col-span-full mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditGuest(null)}
                className="rounded-xl bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-slate-900/80"
              >
                {labels.cancel}
              </button>
              <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400">
                {labels.save}
              </button>
            </div>
          </form>
        ) : null}
      </AppModal>

      {/* Delete Guest Modal */}
      <AppModal
        open={Boolean(deleteGuest)}
        onClose={() => setDeleteGuest(null)}
        title={labels.confirmDeleteTitle}
        maxWidthClass="max-w-md"
        closeLabel={labels.cancel}
      >
        {deleteGuest ? (
          <div className="mt-4">
            <div className="flex items-start gap-3 rounded-xl bg-rose-500/25 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500/40 shadow-lg shadow-rose-500/20">
                <FiTrash2 className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {labels.confirmDeleteMessage}
                </p>
                <p className="mt-1 text-xs text-white/80">
                  <span className="font-semibold">{deleteGuest.first_name} {deleteGuest.last_name}</span>
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteGuest(null)}
                className="rounded-xl bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-slate-900/80"
              >
                {labels.cancel}
              </button>
              <form action="/api/guests" method="post">
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="guestId" value={deleteGuest.id} />
                <button className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-400">
                  {labels.confirmDeleteButton}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </AppModal>
    </div>
  );
}
