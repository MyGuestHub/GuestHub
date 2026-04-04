"use client";

import { useEffect, useState, useCallback } from "react";
import { FiCloud, FiSun, FiDroplet, FiWind, FiCloudRain, FiCloudSnow, FiCloudLightning, FiEye } from "react-icons/fi";

type WeatherLocation = {
  city_en: string;
  city_ar: string;
  lat: number;
  lon: number;
};

type WeatherData = {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  code: number;
};

type Props = {
  lang: "ar" | "en";
  locations: WeatherLocation[];
};

const weatherIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "01": FiSun,
  "02": FiCloud,
  "03": FiCloud,
  "04": FiCloud,
  "09": FiCloudRain,
  "10": FiCloudRain,
  "11": FiCloudLightning,
  "13": FiCloudSnow,
  "50": FiEye,
};

function getWeatherGradient(code: number): { from: string; to: string } {
  if (code >= 200 && code < 300) return { from: "from-slate-600/40", to: "to-purple-600/30" };
  if (code >= 300 && code < 600) return { from: "from-blue-600/30", to: "to-slate-600/30" };
  if (code >= 600 && code < 700) return { from: "from-slate-400/30", to: "to-blue-300/20" };
  if (code >= 700 && code < 800) return { from: "from-slate-500/30", to: "to-amber-500/20" };
  if (code === 800) return { from: "from-amber-500/30", to: "to-orange-500/20" };
  return { from: "from-slate-500/30", to: "to-blue-500/20" };
}

export function WeatherWidget({ lang, locations }: Props) {
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const fetchWeather = useCallback(async () => {
    const results: Record<string, WeatherData> = {};
    for (const loc of locations) {
      const key = `${loc.lat},${loc.lon}`;
      try {
        // Using Open-Meteo API (free, no API key needed)
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`,
        );
        if (res.ok) {
          const data = await res.json();
          const current = data.current;
          const wmoCode = current.weather_code;
          results[key] = {
            temp: Math.round(current.temperature_2m),
            feels_like: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            wind_speed: Math.round(current.wind_speed_10m),
            description: getWMODescription(wmoCode, lang),
            icon: getWMOIcon(wmoCode),
            code: wmoCode,
          };
        }
      } catch {
        // silently fail
      }
    }
    setWeatherData(results);
    setLoading(false);
  }, [locations, lang]);

  useEffect(() => {
    setMounted(true);
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000); // every 15 minutes
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (!locations.length) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/70 p-6 shadow-2xl backdrop-blur-xl transition-all duration-700 ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/30">
            <FiSun className="h-5 w-5 text-orange-300" />
          </div>
          <h2 className="text-lg font-semibold text-white">{t("الطقس", "Weather")}</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => {
            const key = `${loc.lat},${loc.lon}`;
            const data = weatherData[key];
            const grad = data ? getWeatherGradient(data.code) : { from: "from-slate-500/30", to: "to-slate-500/20" };
            const IconComp = data ? (weatherIcons[data.icon] ?? FiCloud) : FiCloud;

            return (
              <div
                key={key}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${grad.from} ${grad.to} p-5 transition-all hover:border-white/20 hover:shadow-lg`}
              >
                {loading ? (
                  <div className="flex h-24 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </div>
                ) : data ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {lang === "ar" ? loc.city_ar : loc.city_en}
                        </p>
                        <p className="mt-1 text-xs text-white/60">{data.description}</p>
                      </div>
                      <IconComp className="h-8 w-8 text-white/80 transition-transform group-hover:scale-110" />
                    </div>
                    <p className="mt-3 text-3xl font-bold text-white">{data.temp}°C</p>
                    <div className="mt-3 flex items-center gap-4 text-[11px] text-white/60">
                      <span className="flex items-center gap-1">
                        <FiDroplet className="h-3 w-3 text-blue-300" />
                        {data.humidity}%
                      </span>
                      <span className="flex items-center gap-1">
                        <FiWind className="h-3 w-3 text-cyan-300" />
                        {data.wind_speed} {t("كم/س", "km/h")}
                      </span>
                      <span className="text-white/40">
                        {t("الإحساس", "Feels")} {data.feels_like}°
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex h-24 flex-col items-center justify-center">
                    <FiCloud className="h-6 w-6 text-white/30" />
                    <p className="mt-2 text-xs text-white/40">{lang === "ar" ? loc.city_ar : loc.city_en}</p>
                    <p className="text-[10px] text-white/30">{t("غير متاح", "Unavailable")}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── WMO weather code descriptions ─────────────────────────────────── */
function getWMODescription(code: number, lang: "ar" | "en"): string {
  const descriptions: Record<number, { ar: string; en: string }> = {
    0: { ar: "صافي", en: "Clear sky" },
    1: { ar: "صافي غالباً", en: "Mainly clear" },
    2: { ar: "غائم جزئياً", en: "Partly cloudy" },
    3: { ar: "غائم", en: "Overcast" },
    45: { ar: "ضباب", en: "Fog" },
    48: { ar: "ضباب متجمد", en: "Rime fog" },
    51: { ar: "رذاذ خفيف", en: "Light drizzle" },
    53: { ar: "رذاذ", en: "Drizzle" },
    55: { ar: "رذاذ كثيف", en: "Dense drizzle" },
    61: { ar: "مطر خفيف", en: "Light rain" },
    63: { ar: "مطر", en: "Rain" },
    65: { ar: "مطر غزير", en: "Heavy rain" },
    71: { ar: "ثلج خفيف", en: "Light snow" },
    73: { ar: "ثلج", en: "Snow" },
    75: { ar: "ثلج كثيف", en: "Heavy snow" },
    80: { ar: "أمطار متفرقة", en: "Rain showers" },
    81: { ar: "أمطار متوسطة", en: "Moderate showers" },
    82: { ar: "أمطار غزيرة", en: "Violent showers" },
    95: { ar: "عاصفة رعدية", en: "Thunderstorm" },
    96: { ar: "عاصفة مع برد", en: "Thunderstorm with hail" },
    99: { ar: "عاصفة رعدية قوية", en: "Severe thunderstorm" },
  };
  return descriptions[code]?.[lang] ?? (lang === "ar" ? "غير معروف" : "Unknown");
}

function getWMOIcon(code: number): string {
  if (code === 0 || code === 1) return "01";
  if (code === 2) return "02";
  if (code === 3) return "04";
  if (code >= 45 && code <= 48) return "50";
  if (code >= 51 && code <= 55) return "09";
  if (code >= 61 && code <= 65) return "10";
  if (code >= 71 && code <= 77) return "13";
  if (code >= 80 && code <= 82) return "09";
  if (code >= 95) return "11";
  return "03";
}
