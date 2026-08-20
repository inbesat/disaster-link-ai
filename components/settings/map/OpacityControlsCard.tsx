"use client";

// ---------------------------------------------------------------------
// components/settings/map/OpacityControlsCard.tsx — Map & GIS (Phase 3 · Step 4).
//
// Visual intensity controls for hazard layers. Four individual opacity
// sliders (0–100%) — one per flood-risk band — each with a live preview
// swatch that fades in real time, plus a "Highlight Critical Zones Only"
// preset that collapses Safe/Watch to 0% and pushes Warning/Evacuate to 100%.
//
// All values live in useMapSettings(...).hazards, so the command-center
// map re-renders the hazard polygons with the exact opacity the operator
// picked.
// ---------------------------------------------------------------------

import { Eye, EyeOff, Tornado } from "lucide-react";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";
import type { FloodOpacityLevels } from "@/lib/settings/map-settings";

type RiskBand = keyof FloodOpacityLevels;

const RISK_BANDS: {
  key: RiskBand;
  label: string;
  color: string;
  text: string;
}[] = [
  { key: "safe", label: "Safe", color: "#22c55e", text: "text-emerald-300" },
  { key: "watch", label: "Watch", color: "#facc15", text: "text-yellow-300" },
  { key: "warning", label: "Warning", color: "#f59e0b", text: "text-amber-300" },
  { key: "evacuate", label: "Evacuate", color: "#ef4444", text: "text-red-300" },
];

const CRITICAL_PRESET: FloodOpacityLevels = {
  safe: 0,
  watch: 0,
  warning: 1,
  evacuate: 1,
};

export default function OpacityControlsCard() {
  const { settings, update } = useMapSettings();
  const hazards = settings.hazards;
  const opacities = hazards.floodOpacities;

  function setOpacity(key: RiskBand, percent: number) {
    update({
      hazards: {
        ...hazards,
        floodOpacities: {
          ...opacities,
          [key]: percent / 100,
        },
      },
    });
  }

  function toggleHighlight(bool: boolean) {
    update({
      hazards: {
        ...hazards,
        highlightCriticalZonesOnly: bool,
        // When the master highlight kicks in, apply the critical-only preset
        // to the four bands immediately.
        floodOpacities: bool ? { ...CRITICAL_PRESET } : { ...opacities },
      },
    });
  }

  return (
    <section
      data-settings-key="map-opacity"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
          <Tornado className="h-5 w-5 text-rose-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-rose-300/80">HAZARD INTENSITY</p>
          <h2 className="mt-0.5 text-lg font-bold">Flood Zone Opacity</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Dial in how strongly each flood-risk band tints the map. Lower
        opacities keep the underlying terrain readable; near-solid zones flag
        do-not-enter areas.
      </p>

      {/* Master highlight toggle */}
      <div
        className={`mt-5 flex items-center justify-between gap-4 rounded-md border p-4 transition ${
          hazards.highlightCriticalZonesOnly
            ? "border-rose-500/40 bg-rose-500/[0.08]"
            : "border-panel-border bg-surface-muted/40"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
              hazards.highlightCriticalZonesOnly
                ? "bg-rose-500/15"
                : "bg-slate-500/10"
            }`}
          >
            {hazards.highlightCriticalZonesOnly ? (
              <Eye className="h-5 w-5 text-rose-300" aria-hidden />
            ) : (
              <EyeOff className="h-5 w-5 text-slate-400" aria-hidden />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">
              Highlight Critical Zones Only
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Instantly sets Watch / Safe to 0% and Warning / Evacuate to 100%
              — perfect for at-a-glance do-not-enter mapping.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={hazards.highlightCriticalZonesOnly}
          aria-label="Highlight critical flood zones only"
          onClick={() => toggleHighlight(!hazards.highlightCriticalZonesOnly)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            hazards.highlightCriticalZonesOnly
              ? "bg-rose-500"
              : "bg-[#2c3f6d]"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              hazards.highlightCriticalZonesOnly
                ? "translate-x-[22px]"
                : "-translate-x-[2px]"
            }`}
          />
        </button>
      </div>

      {/* Opacity sliders */}
      <div className="mt-4 space-y-4">
        {RISK_BANDS.map((band) => {
          const value = Math.round(opacities[band.key] * 100);
          return (
            <div
              key={band.key}
              className={`rounded-md border p-4 transition ${
                hazards.highlightCriticalZonesOnly && value > 0
                  ? "border-rose-500/30"
                  : "border-panel-border bg-surface-muted/40"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-3 w-3 rounded-full border border-white/20`}
                    style={{
                      backgroundColor: band.color,
                      opacity: Math.max(value / 100, 0.12),
                    }}
                    aria-hidden
                  />
                  <p className={`text-sm font-semibold ${band.text}`}>
                    {band.label}
                  </p>
                </div>

                {/* Live preview swatch — fades as the slider moves */}
                <div className="flex items-center gap-3">
                  <span
                    className="h-6 w-10 rounded-sm"
                    style={{ backgroundColor: band.color, opacity: value / 100 }}
                    title={`Live preview at ${value}% opacity`}
                    aria-label={`Live preview: ${band.label} zone at ${value}% opacity`}
                  />
                  <span className="w-12 text-right font-mono text-xs text-slate-400">
                    {value}%
                  </span>
                </div>
              </div>

              <input
                type="range"
                aria-label={`${band.label} zone opacity`}
                min={0}
                max={100}
                step={5}
                value={value}
                onChange={(e) => setOpacity(band.key, Number(e.target.value))}
                className="slider-rail mt-3 w-full cursor-pointer appearance-none rounded-full bg-transparent"
                style={{
                  background: `linear-gradient(to right, ${band.color} ${value}%, #2c3f6d ${value}%)`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Tornado className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Opacity is applied on top of the Flood Risk Zones layer in the tactical
        map.
      </p>
    </section>
  );
}