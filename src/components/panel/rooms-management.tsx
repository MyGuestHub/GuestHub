"use client";

import { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiHome,
  FiCheckCircle,
  FiUsers,
  FiTool,
  FiEdit2,
  FiTrash2,
  FiLayers,
} from "react-icons/fi";
import type { RoomLive } from "@/lib/data";
import { AppModal } from "@/components/ui/app-modal";
import { AppSelect } from "@/components/ui/app-select";

type Labels = {
  addRoom: string;
  editRoom: string;
  deleteRoom: string;
  save: string;
  cancel: string;
  roomNumber: string;
  floor: string;
  roomType: string;
  capacity: string;
  status: string;
  active: string;
  maintenance: string;
  actions: string;
  room: string;
  type: string;
  available: string;
  occupied: string;
  maintenanceLabel: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmDeleteButton: string;
  openAddModal: string;
  openEditModal: string;
  openDeleteDialog: string;
};

type Props = {
  lang: string;
  returnTo: string;
  rooms: RoomLive[];
  canManageRooms: boolean;
  labels: Labels;
};

type StatusFilter = "all" | "available" | "occupied" | "maintenance";

function getStatusConfig(status: "available" | "occupied" | "maintenance") {
  if (status === "available") {
    return {
      bg: "bg-emerald-500/30",
      text: "text-emerald-200",
      icon: FiCheckCircle,
    };
  }
  if (status === "occupied") {
    return {
      bg: "bg-amber-500/30",
      text: "text-amber-200",
      icon: FiUsers,
    };
  }
  return {
    bg: "bg-rose-500/30",
    text: "text-rose-200",
    icon: FiTool,
  };
}

export function RoomsManagement({ lang, returnTo, rooms, canManageRooms, labels }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<RoomLive | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<RoomLive | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  // Stats
  const stats = useMemo(() => {
    const total = rooms.length;
    const available = rooms.filter((r) => r.live_status === "available").length;
    const occupied = rooms.filter((r) => r.live_status === "occupied").length;
    const maintenance = rooms.filter((r) => r.live_status === "maintenance").length;
    return { total, available, occupied, maintenance };
  }, [rooms]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    let result = rooms;
    
    if (statusFilter !== "all") {
      result = result.filter((r) => r.live_status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.room_number.toLowerCase().includes(q) ||
          r.room_type.toLowerCase().includes(q) ||
          (r.floor?.toString() || "").includes(q)
      );
    }
    
    return result;
  }, [rooms, statusFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header with search and add button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("بحث برقم الغرفة أو النوع...", "Search by room number or type...")}
            className="w-full rounded-xl bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:bg-slate-900/70"
          />
        </div>
        {canManageRooms && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/40 px-4 py-2.5 text-sm font-semibold text-emerald-100 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500/50"
          >
            <FiPlus className="h-4 w-4" />
            {labels.openAddModal}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`group flex items-center gap-3 rounded-xl p-3 transition ${
            statusFilter === "all"
              ? "bg-violet-500/30 shadow-lg"
              : "bg-slate-900/50 hover:bg-slate-900/70"
          }`}
        >
          <div className={`rounded-lg p-2 ${statusFilter === "all" ? "bg-violet-400/30" : "bg-white/10"}`}>
            <FiHome className={`h-5 w-5 ${statusFilter === "all" ? "text-violet-200" : "text-white/60"}`} />
          </div>
          <div className="text-start">
            <p className="text-xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/60">{t("إجمالي الغرف", "Total Rooms")}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("available")}
          className={`group flex items-center gap-3 rounded-xl p-3 transition ${
            statusFilter === "available"
              ? "bg-emerald-500/30 shadow-lg"
              : "bg-slate-900/50 hover:bg-slate-900/70"
          }`}
        >
          <div className={`rounded-lg p-2 ${statusFilter === "available" ? "bg-emerald-400/30" : "bg-white/10"}`}>
            <FiCheckCircle className={`h-5 w-5 ${statusFilter === "available" ? "text-emerald-200" : "text-white/60"}`} />
          </div>
          <div className="text-start">
            <p className="text-xl font-bold text-white">{stats.available}</p>
            <p className="text-xs text-white/60">{labels.available}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("occupied")}
          className={`group flex items-center gap-3 rounded-xl p-3 transition ${
            statusFilter === "occupied"
              ? "bg-amber-500/30 shadow-lg"
              : "bg-slate-900/50 hover:bg-slate-900/70"
          }`}
        >
          <div className={`rounded-lg p-2 ${statusFilter === "occupied" ? "bg-amber-400/30" : "bg-white/10"}`}>
            <FiUsers className={`h-5 w-5 ${statusFilter === "occupied" ? "text-amber-200" : "text-white/60"}`} />
          </div>
          <div className="text-start">
            <p className="text-xl font-bold text-white">{stats.occupied}</p>
            <p className="text-xs text-white/60">{labels.occupied}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("maintenance")}
          className={`group flex items-center gap-3 rounded-xl p-3 transition ${
            statusFilter === "maintenance"
              ? "bg-rose-500/30 shadow-lg"
              : "bg-slate-900/50 hover:bg-slate-900/70"
          }`}
        >
          <div className={`rounded-lg p-2 ${statusFilter === "maintenance" ? "bg-rose-400/30" : "bg-white/10"}`}>
            <FiTool className={`h-5 w-5 ${statusFilter === "maintenance" ? "text-rose-200" : "text-white/60"}`} />
          </div>
          <div className="text-start">
            <p className="text-xl font-bold text-white">{stats.maintenance}</p>
            <p className="text-xs text-white/60">{labels.maintenanceLabel}</p>
          </div>
        </button>
      </div>

      {/* Rooms Table */}
      <section className="overflow-hidden rounded-2xl bg-slate-900/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/50 text-xs uppercase tracking-wide text-white/70">
                <th className="px-4 py-3 text-start">{labels.room}</th>
                <th className="px-4 py-3 text-start">{labels.floor}</th>
                <th className="px-4 py-3 text-start">{labels.type}</th>
                <th className="px-4 py-3 text-start">{labels.capacity}</th>
                <th className="px-4 py-3 text-start">{labels.status}</th>
                {canManageRooms && <th className="px-4 py-3 text-start">{labels.actions}</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={canManageRooms ? 6 : 5} className="px-4 py-12 text-center text-white/50">
                    {t("لا توجد غرف مطابقة", "No matching rooms found")}
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const statusConfig = getStatusConfig(room.live_status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={room.id} className="group border-b border-white/5 transition hover:bg-slate-900/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                            <FiHome className="h-5 w-5 text-cyan-300" />
                          </div>
                          <span className="font-semibold text-white">{room.room_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-white/80">
                          <FiLayers className="h-4 w-4 text-white/40" />
                          {room.floor ?? "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/80">{room.room_type}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-white/80">
                          <FiUsers className="h-4 w-4 text-white/40" />
                          {room.capacity}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="h-3 w-3" />
                          {room.live_status === "available"
                            ? labels.available
                            : room.live_status === "occupied"
                              ? labels.occupied
                              : labels.maintenanceLabel}
                        </span>
                      </td>
                      {canManageRooms && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditRoom(room)}
                              className="rounded-lg p-2 text-white/70 transition hover:bg-slate-900/60 hover:text-cyan-400"
                              title={labels.openEditModal}
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteRoom(room)}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Room Modal */}
      <AppModal open={addOpen} onClose={() => setAddOpen(false)} title={labels.addRoom} closeLabel={labels.cancel}>
        <form action="/api/rooms" method="post" className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.roomNumber}</span>
            <input
              name="roomNumber"
              required
              placeholder={labels.roomNumber}
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:bg-white/15"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.floor}</span>
            <input
              name="floor"
              type="number"
              placeholder={labels.floor}
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:bg-white/15"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.roomType}</span>
            <input
              name="roomType"
              placeholder={labels.roomType}
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:bg-white/15"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.capacity}</span>
            <input
              name="capacity"
              type="number"
              min={1}
              defaultValue={2}
              className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition focus:bg-white/15"
            />
          </label>
          <div className="col-span-full mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/20"
            >
              {labels.cancel}
            </button>
            <button className="rounded-xl bg-emerald-500/80 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
              {labels.save}
            </button>
          </div>
        </form>
      </AppModal>

      {/* Edit Room Modal */}
      <AppModal
        open={Boolean(editRoom)}
        onClose={() => setEditRoom(null)}
        title={labels.editRoom}
        closeLabel={labels.cancel}
      >
        {editRoom && (
          <form action="/api/rooms" method="post" className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="lang" value={lang} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="action" value="update" />
            <input type="hidden" name="roomId" value={editRoom.id} />
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.roomNumber}</span>
              <input
                name="roomNumber"
                required
                defaultValue={editRoom.room_number}
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition focus:bg-white/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.floor}</span>
              <input
                name="floor"
                type="number"
                defaultValue={editRoom.floor ?? ""}
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition focus:bg-white/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.roomType}</span>
              <input
                name="roomType"
                defaultValue={editRoom.room_type}
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition focus:bg-white/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.capacity}</span>
              <input
                name="capacity"
                type="number"
                min={1}
                defaultValue={editRoom.capacity}
                className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition focus:bg-white/15"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-white/80">{labels.status}</span>
              <AppSelect name="status" defaultValue={editRoom.status} className="w-full">
                <option value="active" className="text-slate-900">{labels.active}</option>
                <option value="maintenance" className="text-slate-900">{labels.maintenance}</option>
              </AppSelect>
            </label>
            <div className="col-span-full mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRoom(null)}
                className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/20"
              >
                {labels.cancel}
              </button>
              <button className="rounded-xl bg-cyan-500/80 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500">
                {labels.save}
              </button>
            </div>
          </form>
        )}
      </AppModal>

      {/* Delete Confirmation Modal */}
      <AppModal
        open={Boolean(deleteRoom)}
        onClose={() => setDeleteRoom(null)}
        title={labels.confirmDeleteTitle}
        maxWidthClass="max-w-md"
        closeLabel={labels.cancel}
      >
        {deleteRoom && (
          <>
            <p className="mt-1 text-sm text-white/80">
              {labels.confirmDeleteMessage}{" "}
              <span className="font-semibold text-white">#{deleteRoom.room_number}</span>
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteRoom(null)}
                className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/20"
              >
                {labels.cancel}
              </button>
              <form action="/api/rooms" method="post">
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="roomId" value={deleteRoom.id} />
                <button className="rounded-xl bg-rose-500/85 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500">
                  {labels.confirmDeleteButton}
                </button>
              </form>
            </div>
          </>
        )}
      </AppModal>
    </div>
  );
}
