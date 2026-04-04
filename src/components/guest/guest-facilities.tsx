"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCalendar, FiCheck, FiClock, FiMapPin, FiUsers, FiX } from "react-icons/fi";
import type { AppLang } from "@/lib/i18n";

type Facility = {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  capacity: number;
  slot_duration_minutes: number;
  open_time: string;
  close_time: string;
};

type Slot = { start: string; end: string; available: number };
type Booking = {
  id: number;
  facility_name_en: string;
  facility_name_ar: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  status: string;
};

type Props = { lang: AppLang };

const facilityIcons: Record<string, string> = {
  swimming_pool: "🏊",
  gym: "🏋️",
  spa: "💆",
  sauna: "🧖",
  tennis: "🎾",
  kids_club: "🧒",
  meeting_room: "💼",
  restaurant: "🍽️",
};

export function GuestFacilities({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [chosenSlot, setChosenSlot] = useState<Slot | null>(null);
  const [guestsCount, setGuestsCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const loadFacilities = useCallback(async () => {
    const res = await fetch(`/api/guest/facilities?lang=${lang}`);
    if (res.ok) {
      const data = await res.json();
      setFacilities(data.facilities ?? []);
      setBookings(data.bookings ?? []);
    }
  }, [lang]);

  const loadSlots = useCallback(async (facId: number, d: string) => {
    const res = await fetch(`/api/guest/facilities?lang=${lang}&facilityId=${facId}&date=${d}`);
    if (res.ok) setSlots((await res.json()).slots ?? []);
  }, [lang]);

  useEffect(() => { if (open) loadFacilities(); }, [open, loadFacilities]);
  useEffect(() => { if (selected) loadSlots(selected.id, date); }, [selected, date, loadSlots]);

  async function book() {
    if (!selected || !chosenSlot) return;
    setLoading(true);
    const fd = new FormData();
    fd.set("lang", lang);
    fd.set("facilityId", String(selected.id));
    fd.set("bookingDate", date);
    fd.set("startTime", chosenSlot.start);
    fd.set("endTime", chosenSlot.end);
    fd.set("guestsCount", String(guestsCount));
    const res = await fetch("/api/guest/facilities", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (data.ok) {
      setResult(data.message);
      setChosenSlot(null);
      loadFacilities();
      loadSlots(selected.id, date);
      setTimeout(() => setResult(null), 2500);
    }
  }

  async function cancelBooking(id: number) {
    const fd = new FormData();
    fd.set("lang", lang);
    fd.set("action", "cancel");
    fd.set("id", String(id));
    await fetch("/api/guest/facilities", { method: "POST", body: fd });
    loadFacilities();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/50 px-3 py-2 text-sm font-medium text-white/70 backdrop-blur-xl transition hover:bg-white/[0.06]"
      >
        <FiMapPin className="h-4 w-4 text-emerald-400" />
        {t("حجز المرافق", "Facilities")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-base font-bold text-white">
                <FiMapPin className="me-2 inline h-5 w-5 text-emerald-400" />
                {t("حجز المرافق", "Book Facilities")}
              </h2>
              <button onClick={() => { setOpen(false); setSelected(null); }} className="rounded-lg p-1.5 hover:bg-white/10 text-white/50">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Success toast */}
            {result && (
              <div className="mx-4 mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-center text-sm font-medium text-emerald-400">
                <FiCheck className="me-1 inline h-4 w-4" /> {result}
              </div>
            )}

            <div className="p-4 space-y-4">
              {/* My bookings */}
              {bookings.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                    {t("حجوزاتي", "My Bookings")}
                  </h3>
                  <div className="space-y-2">
                    {bookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-2.5">
                        <div>
                          <p className="text-sm font-medium text-white/90">
                            {lang === "ar" ? b.facility_name_ar : b.facility_name_en}
                          </p>
                          <p className="text-xs text-white/50">
                            {b.booking_date} • {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                          </p>
                        </div>
                        <button onClick={() => cancelBooking(b.id)} className="text-xs text-rose-400 hover:text-rose-300">
                          {t("إلغاء", "Cancel")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facility picker */}
              {!selected ? (
                <div className="grid grid-cols-2 gap-2">
                  {facilities.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelected(f)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/50 p-3 text-center transition hover:border-emerald-500/30 hover:bg-white/[0.06]"
                    >
                      <span className="text-2xl">{facilityIcons[f.slug] ?? "🏨"}</span>
                      <p className="text-sm font-medium text-white/90">
                        {lang === "ar" ? f.name_ar : f.name_en}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {f.open_time.slice(0, 5)} – {f.close_time.slice(0, 5)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => { setSelected(null); setSlots([]); setChosenSlot(null); }}
                    className="text-sm text-cyan-400"
                  >
                    ← {t("كل المرافق", "All Facilities")}
                  </button>

                  <h3 className="text-sm font-semibold text-white">
                    {facilityIcons[selected.slug] ?? "🏨"} {lang === "ar" ? selected.name_ar : selected.name_en}
                  </h3>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/50">
                      <FiCalendar className="me-1 inline h-3 w-3" />{t("التاريخ", "Date")}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-xl border border-white/15 bg-slate-800/60 px-3 py-2 text-sm text-white/90"
                    />
                  </div>

                  {/* Slots grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.start}
                        disabled={s.available <= 0}
                        onClick={() => setChosenSlot(chosenSlot?.start === s.start ? null : s)}
                        className={`rounded-xl border p-2 text-center text-xs transition ${
                          chosenSlot?.start === s.start
                            ? "border-emerald-500/40 bg-emerald-500/10 ring-1 ring-emerald-500/40 text-emerald-300"
                            : s.available > 0
                              ? "border-white/10 bg-slate-800/50 text-white/80 hover:border-emerald-500/25"
                              : "border-white/5 bg-slate-800/20 text-white/20 cursor-not-allowed"
                        }`}
                      >
                        <p className="font-medium">{s.start.slice(0, 5)}</p>
                        <p className={`text-[10px] ${s.available > 3 ? "text-emerald-400" : s.available > 0 ? "text-amber-400" : "text-white/20"}`}>
                          {s.available > 0 ? `${s.available} ${t("متاح", "spots")}` : t("ممتلئ", "Full")}
                        </p>
                      </button>
                    ))}
                    {slots.length === 0 && (
                      <p className="col-span-full text-center text-xs text-white/40 py-4">
                        {t("لا توجد فترات متاحة", "No available slots")}
                      </p>
                    )}
                  </div>

                  {/* Guest count + confirm */}
                  {chosenSlot && (
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-white/50">
                          <FiUsers className="me-1 inline h-3 w-3" />{t("عدد الأشخاص", "Guests")}
                        </label>
                        <input
                          type="number"
                          value={guestsCount}
                          onChange={(e) => setGuestsCount(Math.max(1, Number(e.target.value)))}
                          min={1}
                          max={chosenSlot.available}
                          className="w-20 rounded-xl border border-white/15 bg-slate-800/60 px-3 py-2 text-sm text-white/90"
                        />
                      </div>
                      <button
                        onClick={book}
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
                      >
                        {loading
                          ? t("جارٍ الحجز…", "Booking…")
                          : t("تأكيد الحجز", "Confirm Booking")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
