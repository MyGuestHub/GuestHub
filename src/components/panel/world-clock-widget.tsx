"use client";

import { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";

type ClockEntry = {
  city_en: string;
  city_ar: string;
  timezone: string;
};

type Props = {
  lang: "ar" | "en";
  clocks: ClockEntry[];
};

export function WorldClockWidget({ lang, clocks }: Props) {
  const [times, setTimes] = useState<Record<string, { time: string; date: string; offset: string }>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      const newTimes: typeof times = {};
      for (const clock of clocks) {
        try {
          const time = now.toLocaleTimeString(lang, {
            timeZone: clock.timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });
          const date = now.toLocaleDateString(lang, {
            timeZone: clock.timezone,
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          // Get UTC offset
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: clock.timezone,
            timeZoneName: "shortOffset",
          });
          const parts = formatter.formatToParts(now);
          const offsetPart = parts.find((p) => p.type === "timeZoneName");
          newTimes[clock.timezone] = { time, date, offset: offsetPart?.value ?? "" };
        } catch {
          newTimes[clock.timezone] = { time: "--:--:--", date: "", offset: "" };
        }
      }
      setTimes(newTimes);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [clocks, lang]);

  if (!clocks.length) return null;

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  // Get hour for gradient color
  const getHourColor = (tz: string) => {
    try {
      const hour = Number.parseInt(
        new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", hour12: false }),
        10,
      );
      if (hour >= 6 && hour < 12) return { from: "from-amber-500/30", to: "to-orange-500/20", dot: "bg-amber-400" };
      if (hour >= 12 && hour < 18) return { from: "from-cyan-500/30", to: "to-blue-500/20", dot: "bg-cyan-400" };
      if (hour >= 18 && hour < 21) return { from: "from-purple-500/30", to: "to-pink-500/20", dot: "bg-purple-400" };
      return { from: "from-indigo-500/30", to: "to-slate-500/20", dot: "bg-indigo-400" };
    } catch {
      return { from: "from-slate-500/30", to: "to-slate-500/20", dot: "bg-slate-400" };
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/70 p-6 shadow-2xl backdrop-blur-xl transition-all duration-700 ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30">
            <FiClock className="h-5 w-5 text-blue-300" />
          </div>
          <h2 className="text-lg font-semibold text-white">{t("الساعة العالمية", "World Clock")}</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {clocks.map((clock) => {
            const data = times[clock.timezone];
            const colors = getHourColor(clock.timezone);
            return (
              <div
                key={clock.timezone}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${colors.from} ${colors.to} p-4 transition-all hover:border-white/20 hover:shadow-lg`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${colors.dot} animate-pulse`} />
                  <p className="text-sm font-semibold text-white">
                    {lang === "ar" ? clock.city_ar : clock.city_en}
                  </p>
                </div>
                <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-white">
                  {data?.time ?? "--:--:--"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-white/60">{data?.date ?? ""}</p>
                  <p className="text-[10px] font-medium text-white/40">{data?.offset ?? ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
