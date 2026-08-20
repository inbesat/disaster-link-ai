"use client";

// ---------------------------------------------------------------------
// components/settings/map/PerformanceSettingsCard.tsx — Map & GIS (Phase 3 · Step 6).
//
// Performance optimization card:
//   • Master "Map Animations" toggle — smooth pan/zoom transitions,
//     pulsing alert markers, animated evacuation-route drawing.
//   • "Eco Mode / Low-End Device" preset — one tap disables animations,
//     sets data refresh to manual, and turns off the heavy 3D terrain
//     layer to save battery. A "Battery Saver" badge is shown while active.
//   • Any manual override (animations, terrain, refresh cadence) exits Eco
//     Mode so the badge always reflects reality.
// ---------------------------------------------------------------------

import { BatteryMedium, Gauge, Leaf, Sparkles } from "lucide-react";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";

export default function PerformanceSettingsCard() {
  const { settings, update } = useMapSettings();
  const performance = settings.performance;
  const refresh = settings.cache.refreshInterval;

  function setAnimations(enabled: boolean) {
    update({
      performance: { ...performance, animationsEnabled: enabled, ecoMode: false },
    });
  }

  function setTerrain(enabled: boolean) {
    update({
      performance: { ...performance, terrain3d: enabled, ecoMode: false },
    });
  }

  function applyEcoMode() {
    update({
      performance: {
        ...performance,
        animationsEnabled: false,
        terrain3d: false,
        ecoMode: true,
      },
      // Eco Mode forces manual (off) auto-refresh to save battery.
      cache: { ...settings.cache, refreshInterval: "off" },
    });
  }

  function exitEcoMode() {
    update({ performance: { ...performance, ecoMode: false } });
  }

  const rows: {
    key: "animationsEnabled" | "terrain3d";
    label: string;
    description: string;
    icon: typeof Sparkles;
    accent: string;
  }[] = [
    {
      key: "animationsEnabled",
      label: "Map Animations",
      description: "Smooth pan/zoom transitions, pulsing alert markers and animated evacuation-route drawing.",
      icon: Sparkles,
      accent: "bg-sky-500/10 text-sky-300",
    },
    {
      key: "terrain3d",
      label: "3D Terrain Layer",
      description: "Heavy hill-shaded relief. Largest battery drain on low-end field devices.",
      icon: Gauge,
      accent: "bg-indigo-500/10 text-indigo-300",
    },
  ];

  return (
    <section
      data-settings-key="map-performance"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
          <Gauge className="h-5 w-5 text-sky-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-sky-300/80">PERFORMANCE</p>
          <h2 className="mt-0.5 text-lg font-bold">Map Animation &amp; Performance</h2>
        </div>
        {performance.ecoMode && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
            <BatteryMedium className="h-3.5 w-3.5" aria-hidden />
            Battery Saver
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Trade visual polish for battery life. When Eco Mode is active the
        tactical map strips to essentials so field devices keep running on a
        single charge.
      </p>

      {/* Manual toggles */}
      <div className="mt-5 space-y-2.5">
        {rows.map(({ key, label, description, icon: Icon, accent }) => {
          const on = performance[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-md border border-panel-border bg-surface-muted/40 p-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${accent}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Toggle ${label}`}
                onClick={() => (key === "animationsEnabled" ? setAnimations(!on) : setTerrain(!on))}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  on ? "bg-sky-500" : "bg-[#2c3f6d]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    on ? "translate-x-[22px]" : "-translate-x-[2px]"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Eco Mode preset */}
      <div className="mt-5">
        <button
          type="button"
          onClick={performance.ecoMode ? exitEcoMode : applyEcoMode}
          className={`flex w-full items-center justify-between gap-4 rounded-md border p-4 text-left transition ${
            performance.ecoMode
              ? "border-emerald-400/50 bg-emerald-500/10"
              : "border-panel-border bg-surface-muted/40 hover:border-emerald-400/40"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                performance.ecoMode ? "bg-emerald-500/15" : "bg-emerald-500/10"
              }`}
            >
              <Leaf
                className={`h-4 w-4 ${performance.ecoMode ? "text-emerald-300" : "text-emerald-400"}`}
                aria-hidden
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {performance.ecoMode ? "Eco Mode Active" : "Eco Mode / Low-End Device"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                One-tap preset: disables animations, sets data refresh to
                manual{performance.ecoMode ? "" : " and turns off 3D terrain"}.
                {performance.ecoMode && " — data refresh is set to manual."}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-md px-3 py-1.5 text-xs font-bold transition ${
              performance.ecoMode
                ? "bg-emerald-500 text-emerald-950"
                : "bg-[#2c3f6d] text-slate-200"
            }`}
          >
            {performance.ecoMode ? "Deactivate" : "Activate"}
          </span>
        </button>
        <p className="mt-2 text-[11px] text-slate-500">
          Refresh cadence:{" "}
          <span className="font-semibold text-slate-300">
            {refresh === "off"
              ? "Manual"
              : refresh === "30s"
                ? "30 seconds"
                : refresh === "1m"
                  ? "1 minute"
                  : refresh === "5m"
                    ? "5 minutes"
                    : "15 minutes"}
          </span>
          {" · "}matched live from the refresh settings above.
        </p>
      </div>
    </section>
  );
}