"use client";

import { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiLogIn,
  FiUser,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiGrid,
  FiList,
  FiChevronDown,
  FiX,
  FiHome,
} from "react-icons/fi";
import { AppModal } from "@/components/ui/app-modal";
import { AppSelect } from "@/components/ui/app-select";

export type ReservationStatus = "booked" | "checked_in" | "checked_out" | "cancelled";

type Row = {
  id: number;
  guest_id: number;
  room_id: number;
  guest_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  reservation_status: ReservationStatus;
};

type BoardItem = {
  id: number;
  guest_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  reservation_status: ReservationStatus;
};

type Props = {
  lang: "ar" | "en";
  initialRows: Row[];
  allReservations: BoardItem[];
  guestOptions: Array<{ id: number; full_name: string }>;
  roomOptions: Array<{ id: number; room_number: string; room_type: string; live_status: string }>;
};

const statuses: ReservationStatus[] = ["booked", "checked_in", "checked_out", "cancelled"];

function statusMeta(lang: "ar" | "en") {
  return {
    booked: {
      label: lang === "ar" ? "محجوز" : "Booked",
      cardBg: "bg-amber-500/30",
      cardBorder: "border-amber-400/50",
      columnBg: "bg-amber-500/20",
      columnBorder: "border-amber-400/40",
      dotColor: "bg-amber-400",
      badgeClass: "bg-amber-500/40 text-amber-100",
      Icon: FiClock,
    },
    checked_in: {
      label: lang === "ar" ? "تم تسجيل الدخول" : "Checked In",
      cardBg: "bg-blue-500/30",
      cardBorder: "border-blue-400/50",
      columnBg: "bg-blue-500/20",
      columnBorder: "border-blue-400/40",
      dotColor: "bg-blue-400",
      badgeClass: "bg-blue-500/40 text-blue-100",
      Icon: FiLogIn,
    },
    checked_out: {
      label: lang === "ar" ? "مكتمل" : "Completed",
      cardBg: "bg-emerald-500/30",
      cardBorder: "border-emerald-400/50",
      columnBg: "bg-emerald-500/20",
      columnBorder: "border-emerald-400/40",
      dotColor: "bg-emerald-400",
      badgeClass: "bg-emerald-500/40 text-emerald-100",
      Icon: FiCheckCircle,
    },
    cancelled: {
      label: lang === "ar" ? "ملغي" : "Cancelled",
      cardBg: "bg-rose-500/30",
      cardBorder: "border-rose-400/50",
      columnBg: "bg-rose-500/20",
      columnBorder: "border-rose-400/40",
      dotColor: "bg-rose-400",
      badgeClass: "bg-rose-500/40 text-rose-100",
      Icon: FiXCircle,
    },
  } as const;
}

function StatusBadge({ status, lang }: { status: ReservationStatus; lang: "ar" | "en" }) {
  const meta = statusMeta(lang)[status];
  const Icon = meta.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function toInputDateTime(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value: string, lang: "ar" | "en") {
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

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ReservationsLiveView({ lang, initialRows, allReservations, guestOptions, roomOptions }: Props) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [boardItems, setBoardItems] = useState<BoardItem[]>(allReservations);
  const [editReservation, setEditReservation] = useState<Row | null>(null);
  const [deleteReservation, setDeleteReservation] = useState<Row | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusChanging, setStatusChanging] = useState<number | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  // Available rooms for new reservations
  const availableRooms = useMemo(() => {
    return roomOptions.filter((r) => r.live_status === "available");
  }, [roomOptions]);

  const hasAvailableRooms = availableRooms.length > 0;
  const [showFilters, setShowFilters] = useState(false);

  const meta = useMemo(() => statusMeta(lang), [lang]);

  // Filtered rows based on search and status
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        searchQuery === "" ||
        row.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.room_number.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || row.reservation_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchQuery, statusFilter]);

  // Filtered board items
  const filteredBoardItems = useMemo(() => {
    return boardItems.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.room_number.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [boardItems, searchQuery]);

  const columns = useMemo(() => {
    return statuses.map((status) => ({
      status,
      items: filteredBoardItems.filter((item) => item.reservation_status === status),
    }));
  }, [filteredBoardItems]);

  // Stats
  const stats = useMemo(() => {
    const availableRooms = roomOptions.filter((r) => r.live_status === "available").length;
    const occupiedRooms = roomOptions.filter((r) => r.live_status === "occupied").length;
    return {
      total: boardItems.length,
      booked: boardItems.filter((i) => i.reservation_status === "booked").length,
      checked_in: boardItems.filter((i) => i.reservation_status === "checked_in").length,
      checked_out: boardItems.filter((i) => i.reservation_status === "checked_out").length,
      cancelled: boardItems.filter((i) => i.reservation_status === "cancelled").length,
      availableRooms,
      occupiedRooms,
      totalRooms: roomOptions.length,
    };
  }, [boardItems, roomOptions]);

  async function handleStatusChange(itemId: number, newStatus: ReservationStatus) {
    setStatusChanging(itemId);
    try {
      const res = await fetch("/api/reservations/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: itemId, reservation_status: newStatus, sort_order: 0 }],
        }),
      });
      if (res.ok) {
        setBoardItems((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, reservation_status: newStatus } : it)),
        );
        setRows((prev) =>
          prev.map((r) => (r.id === itemId ? { ...r, reservation_status: newStatus } : r)),
        );
      }
    } finally {
      setStatusChanging(null);
    }
  }

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER: Search, Filters, View Toggle, Add Button
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("البحث عن ضيف أو غرفة...", "Search guest or room...")}
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

        <div className="flex items-center gap-2">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              showFilters || statusFilter !== "all"
                ? "bg-teal-500/40 text-teal-200"
                : "bg-slate-900/60 text-white/80 hover:bg-slate-900/80"
            }`}
          >
            <FiFilter className="h-4 w-4" />
            <span className="hidden sm:inline">{t("فلترة", "Filter")}</span>
            {statusFilter !== "all" && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/30 text-xs">1</span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-900/60 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-2 transition ${
                viewMode === "list" ? "bg-slate-900/80 text-white" : "text-white/60 hover:text-white/90"
              }`}
            >
              <FiList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`rounded-lg p-2 transition ${
                viewMode === "board" ? "bg-slate-900/80 text-white" : "text-white/60 hover:text-white/90"
              }`}
            >
              <FiGrid className="h-4 w-4" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowCreate(true)}
            disabled={!hasAvailableRooms}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition ${
              !hasAvailableRooms
                ? "bg-slate-900/40 text-white/40 cursor-not-allowed"
                : "bg-emerald-500/40 text-emerald-100 shadow-emerald-500/20 hover:bg-emerald-500/50"
            }`}
            title={!hasAvailableRooms ? t("لا توجد غرف متاحة", "No rooms available") : undefined}
          >
            <FiPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("حجز جديد", "New Reservation")}</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/20 bg-slate-900/50 p-3">
          <span className="text-xs font-medium text-white/70">{t("الحالة:", "Status:")}</span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === "all"
                ? "bg-slate-900/80 text-white"
                : "bg-slate-900/50 text-white/70 hover:bg-slate-900/70"
            }`}
          >
            {t("الكل", "All")} ({stats.total})
          </button>
          {statuses.map((s) => {
            const m = meta[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === s
                    ? `${m.badgeClass}`
                    : "bg-slate-900/50 text-white/70 hover:bg-slate-900/70"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${m.dotColor}`} />
                {m.label} ({stats[s]})
              </button>
            );
          })}
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="ms-auto flex items-center gap-1 text-xs text-white/50 hover:text-white/80"
            >
              <FiX className="h-3 w-3" />
              {t("مسح الفلتر", "Clear")}
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STATS ROW
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />
        </div>
        <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-5">
        {/* Room Availability */}
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`group flex items-center gap-3 rounded-2xl border p-4 transition ${
            statusFilter === "all"
              ? "border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-blue-500/25"
              : "border-white/15 bg-slate-900/40 hover:bg-slate-900/60"
          }`}
        >
          <div className={`rounded-xl p-2.5 ${statusFilter === "all" ? "bg-cyan-500/40" : "bg-slate-900/60"}`}>
            <FiHome className={`h-5 w-5 ${statusFilter === "all" ? "text-cyan-300" : "text-white/60"}`} />
          </div>
          <div className="text-start">
            <p className="text-2xl font-bold tracking-tight text-white">
              {stats.availableRooms}
              <span className="text-sm font-normal text-white/50">/{stats.totalRooms}</span>
            </p>
            <p className="text-xs text-white/60">{t("غرف متاحة", "Available Rooms")}</p>
          </div>
        </button>

        {[
          { key: "booked" as const, value: stats.booked },
          { key: "checked_in" as const, value: stats.checked_in },
          { key: "checked_out" as const, value: stats.checked_out },
          { key: "cancelled" as const, value: stats.cancelled },
        ].map(({ key, value }) => {
          const m = meta[key];
          const Icon = m.Icon;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
              className={`group flex items-center gap-3 rounded-2xl border p-4 transition ${
                statusFilter === key
                  ? `${m.cardBg} ${m.cardBorder}`
                  : "border-white/15 bg-slate-900/40 hover:bg-slate-900/60"
              }`}
            >
              <div className={`rounded-xl p-2.5 ${m.cardBg}`}>
                <Icon className={`h-5 w-5 ${statusFilter === key ? "text-white" : "text-white/80"}`} />
              </div>
              <div className="text-start">
                <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
                <p className="text-xs text-white/60">{m.label}</p>
              </div>
            </button>
          );
        })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LIST VIEW (Default)
      ═══════════════════════════════════════════════════════════════ */}
      {viewMode === "list" && (
        <section className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.06] shadow-2xl backdrop-blur-xl">
          {filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FiSearch className="mb-3 h-10 w-10 text-white/20" />
              <p className="text-sm text-white/50">
                {searchQuery || statusFilter !== "all"
                  ? t("لا توجد نتائج مطابقة", "No matching results")
                  : t("لا توجد حجوزات", "No reservations yet")}
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
                    <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("الضيف", "Guest")}</th>
                    <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("الغرفة", "Room")}</th>
                    <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("تسجيل الدخول", "Check In")}</th>
                    <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("تسجيل الخروج", "Check Out")}</th>
                    <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("المدة", "Duration")}</th>
                    <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-white/70">{t("الحالة", "Status")}</th>
                    <th className="px-4 py-4 text-end text-xs font-semibold uppercase tracking-wider text-white/70">{t("إجراءات", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredRows.map((reservation) => {
                    const nights = calculateNights(reservation.check_in, reservation.check_out);
                    return (
                      <tr
                        key={reservation.id}
                        className="group transition-colors hover:bg-white/[0.08]"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500/50 to-purple-500/50 ring-2 shadow-md">
                              <FiUser className="h-4 w-4 text-white/80" />
                            </div>
                            <span className="font-medium text-white">{reservation.guest_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-lg bg-slate-900/70 px-2 py-1 text-sm font-semibold text-white shadow-sm">
                            #{reservation.room_number}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <p className="text-white/90">{formatDate(reservation.check_in, lang)}</p>
                            <p className="text-xs text-white/50">{formatTime(reservation.check_in)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <p className="text-white/90">{formatDate(reservation.check_out, lang)}</p>
                            <p className="text-xs text-white/50">{formatTime(reservation.check_out)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-white/70">
                            {nights} {nights === 1 ? t("ليلة", "night") : t("ليالٍ", "nights")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={reservation.reservation_status} lang={lang} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Status Dropdown */}
                            <div className="relative">
                              <select
                                value={reservation.reservation_status}
                                onChange={(e) => handleStatusChange(reservation.id, e.target.value as ReservationStatus)}
                                disabled={statusChanging === reservation.id}
                                className="appearance-none rounded-lg bg-slate-900/70 py-1.5 pe-7 ps-2.5 text-xs text-white outline-none transition hover:bg-slate-900/85 disabled:opacity-50"
                              >
                                {statuses.map((s) => (
                                  <option key={s} value={s} className="bg-slate-800 text-white">
                                    {meta[s].label}
                                  </option>
                                ))}
                              </select>
                              <FiChevronDown className="pointer-events-none absolute end-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40" />
                            </div>
                            <button
                              onClick={() => setEditReservation(reservation)}
                              className="rounded-lg p-2 text-white/70 transition hover:bg-slate-900/60 hover:text-cyan-400"
                              title={t("تعديل", "Edit")}
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteReservation(reservation)}
                              className="rounded-lg p-2 text-white/70 transition hover:bg-slate-900/60 hover:text-rose-400"
                              title={t("حذف", "Delete")}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BOARD VIEW (Kanban)
      ═══════════════════════════════════════════════════════════════ */}
      {viewMode === "board" && (
        <section className="rounded-2xl bg-slate-900/50 p-4 shadow-lg">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {columns.map((col) => {
              const sm = meta[col.status];
              return (
                <div
                  key={col.status}
                  className={`rounded-xl border ${sm.columnBorder} ${sm.columnBg} p-3`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${sm.dotColor}`} />
                    <h3 className="text-sm font-semibold text-white">{sm.label}</h3>
                    <span className="ms-auto rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                      {col.items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {col.items.length === 0 && (
                      <p className="py-8 text-center text-xs text-white/30">
                        {t("لا توجد حجوزات", "No reservations")}
                      </p>
                    )}
                    {col.items.map((item) => (
                      <article
                        key={item.id}
                        className={`rounded-xl border ${sm.cardBorder} ${sm.cardBg} p-3 shadow-md transition hover:bg-slate-900/60`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900/70 shadow-sm">
                            <FiUser className="h-4 w-4 text-white/70" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{item.guest_name}</p>
                            <p className="text-xs text-white/50">#{item.room_number}</p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 text-white/60">
                            <FiCalendar className="h-3 w-3" />
                            <span>{formatDate(item.check_in, lang)} → {formatDate(item.check_out, lang)}</span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {statuses
                            .filter((s) => s !== col.status)
                            .map((s) => {
                              const target = meta[s];
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={statusChanging === item.id}
                                  onClick={() => handleStatusChange(item.id, s)}
                                  className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${target.cardBg} ${target.cardBorder} text-white shadow-sm hover:brightness-110 disabled:opacity-40`}
                                >
                                  {target.label}
                                </button>
                              );
                            })}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════ */}

      {/* Edit Modal */}
      <AppModal
        open={Boolean(editReservation)}
        onClose={() => setEditReservation(null)}
        title={t("تعديل الحجز", "Edit Reservation")}
        closeLabel={t("إلغاء", "Cancel")}
      >
        {editReservation ? (
          <form action="/api/reservations" method="post" className="mt-4 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="lang" value={lang} />
            <input type="hidden" name="returnTo" value={`/${lang}/reservations`} />
            <input type="hidden" name="action" value="update" />
            <input type="hidden" name="reservationId" value={editReservation.id} />

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{t("الضيف", "Guest")}</span>
              <AppSelect name="guestId" defaultValue={editReservation.guest_id} required>
                {guestOptions.map((guest) => (
                  <option key={guest.id} value={guest.id} className="text-slate-900">
                    {guest.full_name}
                  </option>
                ))}
              </AppSelect>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{t("الغرفة", "Room")}</span>
              <AppSelect name="roomId" defaultValue={editReservation.room_id} required>
                {roomOptions.map((room) => {
                  const isCurrentRoom = room.id === editReservation.room_id;
                  const isOccupied = room.live_status === "occupied" && !isCurrentRoom;
                  return (
                    <option 
                      key={room.id} 
                      value={room.id} 
                      className="text-slate-900"
                      disabled={isOccupied}
                    >
                      {room.room_number} - {room.room_type}
                      {isOccupied ? ` (${t("مشغول", "Occupied")})` : ""}
                      {isCurrentRoom && room.live_status === "occupied" ? ` (${t("الحالي", "Current")})` : ""}
                    </option>
                  );
                })}
              </AppSelect>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{t("تسجيل الدخول", "Check in")}</span>
              <input
                name="checkIn"
                type="datetime-local"
                defaultValue={toInputDateTime(editReservation.check_in)}
                required
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{t("تسجيل الخروج", "Check out")}</span>
              <input
                name="checkOut"
                type="datetime-local"
                defaultValue={toInputDateTime(editReservation.check_out)}
                required
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{t("الحالة", "Status")}</span>
              <AppSelect name="status" defaultValue={editReservation.reservation_status}>
                <option value="booked" className="text-slate-900">{t("محجوز", "Booked")}</option>
                <option value="checked_in" className="text-slate-900">{t("تم تسجيل الدخول", "Checked In")}</option>
                <option value="checked_out" className="text-slate-900">{t("مكتمل", "Completed")}</option>
                <option value="cancelled" className="text-slate-900">{t("ملغي", "Cancelled")}</option>
              </AppSelect>
            </label>

            <div className="flex justify-end gap-2 md:col-span-2">
              <button
                type="button"
                onClick={() => setEditReservation(null)}
                className="rounded-xl bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-slate-900/80"
              >
                {t("إلغاء", "Cancel")}
              </button>
              <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400">
                {t("حفظ التغييرات", "Save Changes")}
              </button>
            </div>
          </form>
        ) : null}
      </AppModal>

      {/* Delete Modal */}
      <AppModal
        open={Boolean(deleteReservation)}
        onClose={() => setDeleteReservation(null)}
        title={t("تأكيد حذف الحجز", "Confirm Deletion")}
        closeLabel={t("إلغاء", "Cancel")}
        maxWidthClass="max-w-md"
      >
        {deleteReservation ? (
          <div className="mt-4">
            <div className="flex items-start gap-3 rounded-xl bg-rose-500/25 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500/40 shadow-lg shadow-rose-500/20">
                <FiTrash2 className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {t("هل أنت متأكد من حذف هذا الحجز؟", "Are you sure you want to delete this reservation?")}
                </p>
                <p className="mt-1 text-xs text-white/80">
                  {deleteReservation.guest_name} - #{deleteReservation.room_number}
                </p>
                <p className="mt-2 text-xs text-rose-300/80">
                  {t("لا يمكن التراجع عن هذا الإجراء.", "This action cannot be undone.")}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteReservation(null)}
                className="rounded-xl bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-slate-900/80"
              >
                {t("إلغاء", "Cancel")}
              </button>
              <form action="/api/reservations" method="post">
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="returnTo" value={`/${lang}/reservations`} />
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="reservationId" value={deleteReservation.id} />
                <button className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-400">
                  {t("تأكيد الحذف", "Confirm Delete")}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </AppModal>

      {/* Create Modal */}
      <AppModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t("حجز جديد", "New Reservation")}
        closeLabel={t("إلغاء", "Cancel")}
      >
        <form action="/api/reservations" method="post" className="mt-4 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="returnTo" value={`/${lang}/reservations`} />
          <input type="hidden" name="action" value="create" />

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{t("الضيف", "Guest")}</span>
            <AppSelect name="guestId" required>
              <option value="">{t("اختر الضيف", "Select guest")}</option>
              {guestOptions.map((guest) => (
                <option key={guest.id} value={guest.id} className="text-slate-900">
                  {guest.full_name}
                </option>
              ))}
            </AppSelect>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{t("الغرفة", "Room")}</span>
            <AppSelect name="roomId" required>
              <option value="">{t("اختر الغرفة", "Select room")}</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id} className="text-slate-900">
                  {room.room_number} - {room.room_type}
                </option>
              ))}
            </AppSelect>
            {!hasAvailableRooms && (
              <p className="mt-1.5 text-xs text-amber-300">
                {t("جميع الغرف مشغولة حاليًا", "All rooms are currently occupied")}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{t("تسجيل الدخول", "Check in")}</span>
            <input
              name="checkIn"
              type="datetime-local"
              required
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{t("تسجيل الخروج", "Check out")}</span>
            <input
              name="checkOut"
              type="datetime-local"
              required
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition"
            />
          </label>

          <div className="flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-slate-900/80"
            >
              {t("إلغاء", "Cancel")}
            </button>
            <button className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400">
              {t("إنشاء الحجز", "Create Reservation")}
            </button>
          </div>
        </form>
      </AppModal>
    </div>
  );
}
