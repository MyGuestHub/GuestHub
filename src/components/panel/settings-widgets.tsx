"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FiClock, FiCloud, FiPlus, FiTrash2, FiSave, FiX, FiGlobe, FiMapPin
} from "react-icons/fi";

type ClockEntry = { city_en: string; city_ar: string; timezone: string };
type WeatherEntry = { city_en: string; city_ar: string; lat: number; lon: number };

type Props = {
  lang: "ar" | "en";
  clocks: ClockEntry[];
  weatherLocations: WeatherEntry[];
  returnTo: string;
};

const timezones = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Sao_Paulo", "America/Mexico_City",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Europe/Istanbul",
  "Asia/Dubai", "Asia/Riyadh", "Asia/Tehran", "Asia/Kolkata", "Asia/Shanghai",
  "Asia/Tokyo", "Asia/Seoul", "Asia/Singapore", "Asia/Hong_Kong", "Asia/Jakarta",
  "Australia/Sydney", "Australia/Melbourne",
  "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos",
  "Pacific/Auckland", "Pacific/Honolulu",
];

export function SettingsWidgets({ lang, clocks, weatherLocations, returnTo }: Props) {
  const [clockList, setClockList] = useState<ClockEntry[]>(clocks);
  const [weatherList, setWeatherList] = useState<WeatherEntry[]>(weatherLocations);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const saveSetting = async (key: string, value: unknown) => {
    const fd = new FormData();
    fd.append("lang", lang);
    fd.append("setting_key", key);
    fd.append("setting_value", JSON.stringify(value));
    fd.append("returnTo", returnTo);
    try {
      await fetch("/api/admin/settings", { method: "POST", body: fd, redirect: "manual" });
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
    }
  };

  const addClock = () => {
    setClockList([...clockList, { city_en: "", city_ar: "", timezone: "Europe/London" }]);
  };

  const removeClock = (idx: number) => {
    setClockList(clockList.filter((_, i) => i !== idx));
  };

  const updateClock = (idx: number, field: keyof ClockEntry, value: string) => {
    const updated = [...clockList];
    updated[idx] = { ...updated[idx], [field]: value };
    setClockList(updated);
  };

  const addWeather = () => {
    setWeatherList([...weatherList, { city_en: "", city_ar: "", lat: 0, lon: 0 }]);
  };

  const removeWeather = (idx: number) => {
    setWeatherList(weatherList.filter((_, i) => i !== idx));
  };

  const updateWeather = (idx: number, field: keyof WeatherEntry, value: string | number) => {
    const updated = [...weatherList];
    updated[idx] = { ...updated[idx], [field]: value };
    setWeatherList(updated);
  };

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════════
          World Clock Settings
          ═══════════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30">
              <FiClock className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{t("الساعة العالمية", "World Clock")}</h3>
              <p className="text-xs text-white/50">{t("إضافة ساعات المدن في لوحة التحكم", "Add city clocks to dashboard")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={addClock}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/30"
          >
            <FiPlus className="h-4 w-4" />
            {t("إضافة", "Add")}
          </button>
        </div>
        <div className="space-y-3 p-6">
          {clockList.length === 0 && (
            <p className="text-center text-sm text-white/40 py-4">{t("لا توجد ساعات. أضف واحدة!", "No clocks. Add one!")}</p>
          )}
          {clockList.map((clock, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <FiGlobe className="h-5 w-5 shrink-0 text-blue-300" />
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-white/50">{t("المدينة (EN)", "City (EN)")}</label>
                  <input
                    value={clock.city_en}
                    onChange={(e) => updateClock(idx, "city_en", e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-400/60"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-white/50">{t("المدينة (AR)", "City (AR)")}</label>
                  <input
                    value={clock.city_ar}
                    onChange={(e) => updateClock(idx, "city_ar", e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-400/60"
                    placeholder="نيويورك"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-white/50">{t("المنطقة الزمنية", "Timezone")}</label>
                  <select
                    value={clock.timezone}
                    onChange={(e) => updateClock(idx, "timezone", e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-400/60"
                  >
                    {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeClock(idx)}
                className="rounded-lg p-2 text-white/50 transition hover:bg-rose-500/20 hover:text-rose-300"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => saveSetting("world_clocks", clockList)}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
            >
              <FiSave className="h-4 w-4" />
              {t("حفظ الساعات", "Save Clocks")}
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Weather Settings
          ═══════════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/30">
              <FiCloud className="h-5 w-5 text-orange-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{t("الطقس", "Weather")}</h3>
              <p className="text-xs text-white/50">{t("إضافة مواقع الطقس في لوحة التحكم", "Add weather locations to dashboard")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={addWeather}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500/20 px-3 py-2 text-sm font-medium text-orange-200 transition hover:bg-orange-500/30"
          >
            <FiPlus className="h-4 w-4" />
            {t("إضافة", "Add")}
          </button>
        </div>
        <div className="space-y-3 p-6">
          {weatherList.length === 0 && (
            <p className="text-center text-sm text-white/40 py-4">{t("لا توجد مواقع. أضف واحداً!", "No locations. Add one!")}</p>
          )}
          {weatherList.map((loc, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <FiMapPin className="h-5 w-5 shrink-0 text-orange-300" />
              <div className="grid flex-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-white/50">{t("المدينة (EN)", "City (EN)")}</label>
                  <input
                    value={loc.city_en}
                    onChange={(e) => updateWeather(idx, "city_en", e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-400/60"
                    placeholder="Dubai"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-white/50">{t("المدينة (AR)", "City (AR)")}</label>
                  <input
                    value={loc.city_ar}
                    onChange={(e) => updateWeather(idx, "city_ar", e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-400/60"
                    placeholder="دبي"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-white/50">{t("خط العرض", "Latitude")}</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={loc.lat}
                    onChange={(e) => updateWeather(idx, "lat", Number.parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-400/60"
                    placeholder="25.2048"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-white/50">{t("خط الطول", "Longitude")}</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={loc.lon}
                    onChange={(e) => updateWeather(idx, "lon", Number.parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-400/60"
                    placeholder="55.2708"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeWeather(idx)}
                className="rounded-lg p-2 text-white/50 transition hover:bg-rose-500/20 hover:text-rose-300"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => saveSetting("weather_locations", weatherList)}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
            >
              <FiSave className="h-4 w-4" />
              {t("حفظ الطقس", "Save Weather")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
