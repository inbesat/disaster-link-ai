"use client";

// ---------------------------------------------------------------------
// components/settings/MapDisplayOptionsCard.tsx — Map & GIS (Phase 3).
//
// Section 3 · "Display Options" — how the map presents data:
//   • Measurement units (metric km / imperial mi)
//   • Basemap style (standard · satellite · dark tactical)
//   • Data labels toggles (district labels, severity heat, scale bar)
//
// Fully controlled via useMapSettings — every change re-renders the
// command-center map immediately.
// ---------------------------------------------------------------------

import {
  Compass,
  Layers,
  Map as MapIcon,
  Sun,
  Thermometer,
} from "lucide-react";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";
import type { MapBasemapStyle } from "@/lib/settings/map-settings";
import UnitPreferences from "@/components/settings/map/UnitPreferences";

const BASEMAP_OPTIONS: {
  value: MapBasemapStyle;
  label: string;
  square: string;
}[] = [
  {
    value: "satellite",
    label: "Satellite",
    square: "from-emerald-700 via-teal-800 to-cyan-900 text-emerald-100",
  },
  {
    value: "terrain",
    label: "Terrain",
    square: "from-lime-800 via-emerald-700 to-slate-700 text-lime-100",
  },
  {
    value: "street",
    label: "Street",
    square: "from-sky-100 to-slate-200 text-slate-600",
  },
  {
    value: "tactical_dark",
    label: "Tactical Dark",
    square: "from-slate-800 to-slate-950 text-cyan-200",
  },
];

export default function MapDisplayOptionsCard() {
  const { settings, update } = useMapSettings();
  const display = settings.display;

  function setBasemap(basemapStyle: MapBasemapStyle) {
    update({ display: { ...display, basemapStyle } });
  }

  function toggle(key: "showDistrictLabels" | "showSeverityHeat" | "showScaleBar") {
    update({ display: { ...display, [key]: !display[key] } });
  }

  return (
    <section
      data-settings-key="map-units"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Layers className="h-5 w-5 text-amber-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-amber-300/80">RENDERING</p>
          <h2 className="mt-0.5 text-lg font-bold">Display Options</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Tune measurements, base style and on-map labels to match your
        operational briefing style.
      </p>

      {/* Units & Coordinate Format */}
      <UnitPreferences />

      {/* Basemap style */}
      <div className="mt-5">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Compass className="h-3.5 w-3.5" aria-hidden />
          Basemap Style
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {BASEMAP_OPTIONS.map((option) => {
            const active = display.basemapStyle === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setBasemap(option.value)}
                aria-pressed={active}
                className={`rounded-md border px-2 py-2.5 text-center transition ${
                  active
                    ? "border-amber-400/60 bg-amber-500/10"
                    : "border-[#1c2740] bg-surface-muted/40 hover:border-amber-400/40"
                }`}
              >
                <div
                  className={`mx-auto h-8 w-12 rounded-sm bg-gradient-to-br ${option.square}`}
                />
                <p className={`mt-1.5 text-[10px] font-semibold ${active ? "text-amber-200" : "text-slate-400"}`}>
                  {option.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggle switches */}
      <div className="mt-5 space-y-2.5">
        {(
          [
            {
              key: "showDistrictLabels" as const,
              label: "District Labels",
              description: "Overlay district/block names at every zoom.",
              icon: MapIcon,
            },
            {
              key: "showSeverityHeat" as const,
              label: "Severity Heat Shading",
              description: "Color-pulse zones by watch / warning / critical.",
              icon: Thermometer,
            },
            {
              key: "showScaleBar" as const,
              label: "Scale Bar",
              description: "Show a distance scale in the corner.",
              icon: Sun,
            },
          ] as const
        ).map(({ key, label, description, icon: Icon }) => {
          const on = display[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-md border border-[#1c2740] bg-surface-muted/40 p-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                  <Icon className="h-4 w-4 text-amber-300" aria-hidden />
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
                onClick={() => toggle(key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  on ? "bg-amber-500" : "bg-[#2c3f6d]"
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
    </section>
  );
}