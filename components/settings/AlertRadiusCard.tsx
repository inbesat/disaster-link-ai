"use client";

// ---------------------------------------------------------------------
// components/settings/AlertRadiusCard.tsx — Settings · Phase 2 · Step 5.
//
// Geospatial Alert Radius for /settings/notifications:
//   • A sleek range slider with discrete snap points — 5km, 10km, 25km,
//     50km, District-Wide, All India — implemented as a segmented rail.
//   • Helper text that updates live: "You will only receive alerts for
//     events within [X]km of your current live GPS location."
//   • Secondary toggle: "Always notify me for events affecting my assigned
//     Home District, regardless of my current GPS."
//
// The slider uses index-snapping (each step is one RANGE_OPTION) so the
// thumb always sits exactly on a labeled point.
// ---------------------------------------------------------------------

import { Globe2, Home, LocateFixed, MapPinned, Radar } from "lucide-react";
import { RADIUS_OPTIONS, radiusHelperText } from "@/lib/notification-radius";

export default function AlertRadiusCard({
  radiusIndex,
  homeDistrictAlerts,
  onRadiusIndexChange,
  onHomeDistrictAlertsChange,
}: {
  radiusIndex: number;
  homeDistrictAlerts: boolean;
  onRadiusIndexChange: (next: number) => void;
  onHomeDistrictAlertsChange: (next: boolean) => void;
}) {
  const option = RADIUS_OPTIONS[radiusIndex];
  const percent = (radiusIndex / (RADIUS_OPTIONS.length - 1)) * 100;

  const helper = radiusHelperText(radiusIndex);

  return (
    <section
      data-settings-key="alert-radius"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <Radar className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-emerald-300/80">GEOSPATIAL FILTER</p>
          <h2 className="mt-0.5 text-lg font-bold">Geospatial Alert Radius</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Only alert me to events near my responder position — cuts long-range
        noise while keeping your district visible.
      </p>

      {/* Current radius badge */}
      <div className="mt-4 flex items-center gap-2 rounded-md border border-panel-border bg-surface-muted/40 px-3 py-2">
        <MapPinned className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
        <span className="text-sm font-semibold text-slate-200">
          Current radius: {option.label}
        </span>
      </div>

      {/* Slider */}
      <div className="mt-5">
        <input
          type="range"
          aria-label="Geospatial alert radius"
          aria-valuetext={option.label}
          min={0}
          max={RADIUS_OPTIONS.length - 1}
          step={1}
          value={radiusIndex}
          onChange={(e) => onRadiusIndexChange(Number(e.target.value))}
          className="slider-rail w-full cursor-pointer appearance-none rounded-full bg-transparent"
          style={{
            // Emphasize the filled portion up to the thumb.
            background: `linear-gradient(to right, #34d399 ${percent}%, #2c3f6d ${percent}%)`,
          }}
        />

        {/* Snap labels */}
        <div className="mt-3 flex justify-between gap-1 text-center">
          {RADIUS_OPTIONS.map((option, i) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onRadiusIndexChange(i)}
              className={`rounded px-0.5 text-eoc-tiny font-bold transition ${
                i === radiusIndex
                  ? "text-emerald-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live helper text */}
      <p
        className="mt-4 rounded-md border border-panel-border bg-surface-muted/40 p-3 text-xs leading-relaxed text-slate-300"
        aria-live="polite"
      >
        <LocateFixed className="mr-1.5 inline h-3.5 w-3.5 text-emerald-300" aria-hidden />
        {helper}
      </p>

      {/* Home District always-on toggle */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
            <Home className="h-4 w-4 text-emerald-300" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Always notify me for events affecting my assigned Home District
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Bypasses the radius above — Patna alerts always break through,
              regardless of your current GPS.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={homeDistrictAlerts}
          aria-label="Always notify for assigned home district events"
          onClick={() => onHomeDistrictAlertsChange(!homeDistrictAlerts)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
            homeDistrictAlerts ? "bg-emerald-500" : "bg-[#2c3f6d]"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              homeDistrictAlerts ? "translate-x-[26px]" : "-translate-x-[2px]"
            }`}
          />
        </button>
      </div>

      {/* Helper footer */}
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Globe2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Radius filtering uses your live GPS marker. Home-district coverage
          keeps{" "}
          <span className="font-semibold text-emerald-300">Patna</span> (assigned
          district) visible.
        </span>
      </p>
    </section>
  );
}