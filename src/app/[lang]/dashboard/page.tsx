import { PanelShell } from "@/components/panel/panel-shell";
import { DashboardGrid } from "@/components/panel/dashboard-grid";
import { getRoomStats, getServiceRequestStats, getDashboardSetting, getRatingStats, getRecentReviews } from "@/lib/data";
import { hasPermission } from "@/lib/auth";
import { requirePanelContext } from "@/lib/panel";
import { WorldClockWidget } from "@/components/panel/world-clock-widget";
import { WeatherWidget } from "@/components/panel/weather-widget";
import { GuestSatisfactionWidget } from "@/components/panel/guest-satisfaction-widget";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
};

type ClockEntry = { city_en: string; city_ar: string; timezone: string };
type WeatherEntry = { city_en: string; city_ar: string; lat: number; lon: number };

export default async function DashboardPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);

  const [stats, srStats, clocksRaw, weatherRaw, ratingStats, recentReviews] = await Promise.all([
    getRoomStats(),
    hasPermission(ctx.user, "services.manage")
      ? getServiceRequestStats()
      : Promise.resolve(null),
    getDashboardSetting("world_clocks"),
    getDashboardSetting("weather_locations"),
    getRatingStats(),
    getRecentReviews(5),
  ]);

  const serviceOpen = srStats ? srStats.pending + srStats.accepted + srStats.in_progress : 0;
  const hasServicePermission = hasPermission(ctx.user, "services.manage");

  const clocks = (Array.isArray(clocksRaw) ? clocksRaw : []) as ClockEntry[];
  const weatherLocations = (Array.isArray(weatherRaw) ? weatherRaw : []) as WeatherEntry[];

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="dashboard"
      title={ctx.t("لوحة التحكم", "Dashboard")}
      backgroundImage="/back.jpeg"
    >
      <div className="mx-auto w-full max-w-6xl space-y-4 p-1 md:p-2">
          {query.error ? (
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20">
                <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-rose-200">{query.error}</p>
            </div>
          ) : null}
          {query.ok ? (
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-emerald-200">{query.ok}</p>
            </div>
          ) : null}

          <DashboardGrid
            lang={ctx.lang}
            roomCount={stats.total}
            serviceOpen={serviceOpen}
            srStats={srStats}
            hasServicePermission={hasServicePermission}
          />

          {/* World Clock Widget */}
          {clocks.length > 0 && (
            <WorldClockWidget lang={ctx.lang} clocks={clocks} />
          )}

          {/* Weather Widget */}
          {weatherLocations.length > 0 && (
            <WeatherWidget lang={ctx.lang} locations={weatherLocations} />
          )}

          {/* Guest Satisfaction Widget */}
          {ratingStats.total > 0 && (
            <GuestSatisfactionWidget
              lang={ctx.lang}
              stats={ratingStats}
              reviews={recentReviews}
            />
          )}
      </div>
    </PanelShell>
  );
}
