"use client";

import { FiBell, FiGrid } from "react-icons/fi";

type Room = {
  id: number;
  room_number: string;
  room_type: string;
  live_status: "available" | "occupied" | "maintenance";
  notification_count?: number;
};

type Props = {
  rooms: Room[];
  labels: {
    available: string;
    occupied: string;
    maintenance: string;
    notification: string;
  };
};

function badgeStyle(status: Room["live_status"]) {
  if (status === "available") return "bg-emerald-100 text-emerald-700";
  if (status === "occupied") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function statusText(status: Room["live_status"], labels: Props["labels"]) {
  if (status === "available") return labels.available;
  if (status === "occupied") return labels.occupied;
  return labels.maintenance;
}

export function RoomCarousel({ rooms, labels }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <article key={room.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-900">{room.room_number}</p>
            <FiGrid className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-2 text-sm text-slate-600">{room.room_type}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className={`inline-flex rounded-full px-2.5 py-1 text-xs ${badgeStyle(room.live_status)}`}>
              {statusText(room.live_status, labels)}
            </p>
            {(room.notification_count ?? 0) > 0 ? (
              <p className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs text-rose-700">
                <FiBell className="h-3.5 w-3.5" />
                {labels.notification}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
