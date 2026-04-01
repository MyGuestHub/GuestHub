"use client";

import { useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiLogIn, FiXCircle } from "react-icons/fi";
import {
  ReservationsBoardDnd,
  type ReservationBoardItem,
  type ReservationStatus,
} from "@/components/panel/reservations-board-dnd";

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

type Props = {
  lang: "ar" | "en";
  initialRows: Row[];
  initialBoard: ReservationBoardItem[];
  guestOptions: Array<{ id: number; full_name: string }>;
  roomOptions: Array<{ id: number; room_number: string; room_type: string }>;
};

function statusMeta(lang: "ar" | "en") {
  return {
    booked: {
      label: lang === "ar" ? "محجوز" : "Booked",
      className: "bg-amber-100 text-amber-700 border-amber-200",
      Icon: FiClock,
    },
    checked_in: {
      label: lang === "ar" ? "تم تسجيل الدخول" : "Checked In",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      Icon: FiLogIn,
    },
    checked_out: {
      label: lang === "ar" ? "مكتمل" : "Completed",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Icon: FiCheckCircle,
    },
    cancelled: {
      label: lang === "ar" ? "ملغي" : "Cancelled",
      className: "bg-rose-100 text-rose-700 border-rose-200",
      Icon: FiXCircle,
    },
  } as const;
}

function StatusBadge({ status, lang }: { status: ReservationStatus; lang: "ar" | "en" }) {
  const meta = statusMeta(lang)[status];
  const Icon = meta.Icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function toInputDateTime(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function ReservationsLiveView({ lang, initialRows, initialBoard, guestOptions, roomOptions }: Props) {
  const [rows, setRows] = useState<Row[]>(initialRows);

  const rowMap = useMemo(() => {
    const map = new Map<number, Row>();
    for (const row of rows) map.set(row.id, row);
    return map;
  }, [rows]);

  function handleBoardChange(nextBoard: ReservationBoardItem[]) {
    const statusById = new Map<number, ReservationStatus>();
    for (const item of nextBoard) {
      statusById.set(item.id, item.reservation_status);
    }

    setRows((prev) =>
      prev.map((row) => {
        const nextStatus = statusById.get(row.id);
        if (!nextStatus || nextStatus === row.reservation_status) return row;
        return { ...row, reservation_status: nextStatus };
      }),
    );
  }

  return (
    <>
      <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">{lang === "ar" ? "الضيف" : "Guest"}</th>
                <th className="px-4 py-3 text-left">{lang === "ar" ? "الغرفة" : "Room"}</th>
                <th className="px-4 py-3 text-left">{lang === "ar" ? "الدخول" : "Check in"}</th>
                <th className="px-4 py-3 text-left">{lang === "ar" ? "الخروج" : "Check out"}</th>
                <th className="px-4 py-3 text-left">{lang === "ar" ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3 text-left">{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((reservation) => {
                const boardState = rowMap.get(reservation.id);
                const status = boardState?.reservation_status ?? reservation.reservation_status;
                return (
                  <tr key={reservation.id} className="border-t border-slate-200 text-slate-700">
                    <td className="px-4 py-3 font-medium">{reservation.guest_name}</td>
                    <td className="px-4 py-3">#{reservation.room_number}</td>
                    <td className="px-4 py-3 text-xs">{new Date(reservation.check_in).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{new Date(reservation.check_out).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} lang={lang} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <form action="/api/reservations" method="post" className="grid min-w-[560px] gap-2 md:grid-cols-2">
                          <input type="hidden" name="lang" value={lang} />
                          <input type="hidden" name="returnTo" value={`/${lang}/reservations`} />
                          <input type="hidden" name="action" value="update" />
                          <input type="hidden" name="reservationId" value={reservation.id} />
                          <select
                            name="guestId"
                            defaultValue={reservation.guest_id}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                            required
                          >
                            {guestOptions.map((guest) => (
                              <option key={guest.id} value={guest.id}>
                                {guest.full_name}
                              </option>
                            ))}
                          </select>
                          <select
                            name="roomId"
                            defaultValue={reservation.room_id}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                            required
                          >
                            {roomOptions.map((room) => (
                              <option key={room.id} value={room.id}>
                                {room.room_number} - {room.room_type}
                              </option>
                            ))}
                          </select>
                          <input
                            name="checkIn"
                            type="datetime-local"
                            defaultValue={toInputDateTime(reservation.check_in)}
                            required
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                          />
                          <input
                            name="checkOut"
                            type="datetime-local"
                            defaultValue={toInputDateTime(reservation.check_out)}
                            required
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                          />
                          <select
                            name="status"
                            defaultValue={status}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                          >
                            <option value="booked">{lang === "ar" ? "محجوز" : "Booked"}</option>
                            <option value="checked_in">{lang === "ar" ? "تم تسجيل الدخول" : "Checked In"}</option>
                            <option value="checked_out">{lang === "ar" ? "مكتمل" : "Completed"}</option>
                            <option value="cancelled">{lang === "ar" ? "ملغي" : "Cancelled"}</option>
                          </select>
                          <div className="flex flex-wrap gap-2">
                            <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                              {lang === "ar" ? "حفظ" : "Save"}
                            </button>
                          </div>
                        </form>
                        <form action="/api/reservations" method="post">
                          <input type="hidden" name="lang" value={lang} />
                          <input type="hidden" name="returnTo" value={`/${lang}/reservations`} />
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="reservationId" value={reservation.id} />
                          <button
                            onClick={(event) => {
                              if (!window.confirm(lang === "ar" ? "حذف هذا الحجز؟" : "Delete this reservation?")) {
                                event.preventDefault();
                              }
                            }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                          >
                            {lang === "ar" ? "حذف" : "Delete"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          {lang === "ar" ? "برد الحجوزات (سحب وإفلات)" : "Reservations Board (Drag & Drop)"}
        </h2>
        <ReservationsBoardDnd lang={lang} initialItems={initialBoard} onItemsChange={handleBoardChange} />
      </section>
    </>
  );
}
