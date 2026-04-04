import { PanelShell } from "@/components/panel/panel-shell";
import { SettingsWidgets } from "@/components/panel/settings-widgets";
import { getDashboardSetting } from "@/lib/data";
import { requirePanelContext, requirePermissionOrRedirect } from "@/lib/panel";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
};

type ClockEntry = { city_en: string; city_ar: string; timezone: string };
type WeatherEntry = { city_en: string; city_ar: string; lat: number; lon: number };

export default async function SettingsPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const ctx = await requirePanelContext(routeParams.lang);
  requirePermissionOrRedirect(ctx, "settings.manage", "dashboard");

  const [clocksRaw, weatherRaw] = await Promise.all([
    getDashboardSetting("world_clocks"),
    getDashboardSetting("weather_locations"),
  ]);

  const clocks = (Array.isArray(clocksRaw) ? clocksRaw : []) as ClockEntry[];
  const weatherLocations = (Array.isArray(weatherRaw) ? weatherRaw : []) as WeatherEntry[];

  return (
    <PanelShell
      lang={ctx.lang}
      user={ctx.user}
      active="settings"
      title={ctx.t("الإعدادات", "Settings")}
    >
      {query.error ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20">
            <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-rose-200">{query.error}</p>
        </div>
      ) : null}

      {query.ok ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-200">{query.ok}</p>
        </div>
      ) : null}

      <SettingsWidgets
        lang={ctx.lang}
        clocks={clocks}
        weatherLocations={weatherLocations}
        returnTo={`/${ctx.lang}/settings`}
      />
    </PanelShell>
  );
}
