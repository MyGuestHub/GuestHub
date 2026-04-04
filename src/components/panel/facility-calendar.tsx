"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiX } from "react-icons/fi";

type FacilityType = {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  capacity: number;
  slot_duration_minutes: number;
  open_time: string;
  close_time: string;
};

type Booking = {
  id: number;
  facility_name_en: string;
  facility_name_ar: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  status: string;
  guest_name: string;
  room_number: string;
};

type Props = { lang: string };

const FACILITY_ICONS: Record<string, string> = {
  swimming_pool: "🏊", gym: "🏋️", spa: "💆", sauna: "🧖",
  tennis: "🎾", kids_club: "🧒", meeting_room: "💼", restaurant: "🍽️",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500/20 text-emerald-300",
  cancelled: "bg-rose-500/20 text-rose-300",
  completed: "bg-slate-500/20 text-slate-400",
};

export function FacilityCalendar({ lang }: Props) {
  const [facilities, setFacilities] = useState<FacilityType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterFacility, setFilterFacility] = useState<number | undefined>();
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterFacility) params.set("facilityId", String(filterFacility));
    if (filterDate) params.set("date", filterDate);
    const res = await fetch(`/api/admin/facilities?${params}`);
    if (res.ok) {
      const data = await res.json();
      setFacilities(data.facilities ?? []);
      setBookings(data.bookings ?? []);
    }
  }, [filterFacility, filterDate]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  async function cancelBooking(id: number) {
    const fd = new FormData();
    fd.set("action", "cancel");
    fd.set("id", String(id));
    await fetch("/api/admin/facilities", { method: "POST", body: fd });
    load();
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">{t("المرفق", "Facility")}</label>
          <select
            value={filterFacility ?? ""}
            onChange={(e) => setFilterFacility(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="">{t("الكل", "All")}</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {FACILITY_ICONS[f.slug] ?? ""} {lang === "ar" ? f.name_ar : f.name_en}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">{t("التاريخ", "Date")}</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      {/* Facility capacity overview */}
      <div className="grid gap-3 sm:grid-cols-4">
        {facilities.map((f) => {
          const facBookings = bookings.filter(
            (b) => (lang === "ar" ? b.facility_name_ar : b.facility_name_en) === (lang === "ar" ? f.name_ar : f.name_en) && b.status === "confirmed",
          );
          const totalGuests = facBookings.reduce((s, b) => s + b.guests_count, 0);
          return (
            <button
              key={f.id}
              onClick={() => setFilterFacility(filterFacility === f.id ? undefined : f.id)}
              className={`rounded-xl p-3 text-start transition ${
                filterFacility === f.id ? "bg-white/15 ring-1 ring-white/20" : "bg-slate-900/60 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{FACILITY_ICONS[f.slug] ?? "🏨"}</span>
                <p className="text-xs font-medium text-white">{lang === "ar" ? f.name_ar : f.name_en}</p>
              </div>
              <p className="text-[10px] text-white/40">
                {facBookings.length} {t("حجز", "bookings")} • {totalGuests}/{f.capacity} {t("شخص", "pax")}
              </p>
            </button>
          );
        })}
      </div>

      {/* Bookings list */}
      <div className="space-y-2">
        {bookings.length === 0 && (
          <div className="rounded-2xl bg-slate-900/50 p-10 text-center text-sm text-white/40">
            <FiCalendar className="mx-auto mb-2 h-8 w-8" />
            {t("لا توجد حجوزات", "No bookings")}
          </div>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl shrink-0">{FACILITY_ICONS[facilities.find((f) => (lang === "ar" ? f.name_ar : f.name_en) === (lang === "ar" ? b.facility_name_ar : b.facility_name_en))?.slug ?? ""] ?? "🏨"}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {lang === "ar" ? b.facility_name_ar : b.facility_name_en}
                </p>
                <p className="text-xs text-white/50">
                  <FiClock className="me-0.5 inline h-3 w-3" />
                  {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                  <span className="ms-2"><FiUsers className="me-0.5 inline h-3 w-3" />{b.guests_count}</span>
                </p>
                <p className="text-xs text-white/40">
                  {b.guest_name} • {t("غرفة", "Room")} {b.room_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[b.status] ?? ""}`}>
                {b.status}
              </span>
              {b.status === "confirmed" && (
                <button onClick={() => cancelBooking(b.id)} className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10">
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
