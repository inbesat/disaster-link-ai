"use client";

// ---------------------------------------------------------------------
// components/settings/map/UnitPreferences.tsx — Map & GIS (Phase 3 · Step 5).
//
// Measurement unit configurations embedded inside the "Display Options"
// section:
//   • Distance & Elevation Units — Metric (km · m · km/h) vs Imperial
//     (miles · ft · mph). Metric is the default, matching the standard
//     for Indian disaster management.
//   • Coordinate Format — Decimal Degrees (DD) vs Degrees·Minutes·Seconds
//     (DMS).
//
// Both choices flow through useMapSettings → localStorage
// ("drip_map_settings_v1") so the main map's routing engine formats every
// distance / coordinate the same way an operator sees it here.
// -----------------------------------------------------------------------------

import { LocateFixed, Scale3D } from "lucide-react";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";
import type {
  CoordinateFormat,
  MapUnits,
} from "@/lib/settings/map-settings";

const UNIT_OPTIONS: {
  value: MapUnits;
  label: string;
  hint: string;
  note: string;
}[] = [
  {
    value: "metric",
    label: "Metric",
    hint: "km · m · km/h",
    note: "Standard for Indian disaster management",
  },
  {
    value: "imperial",
    label: "Imperial",
    hint: "miles · ft · mph",
    note: "US field teams",
  },
];

const COORD_OPTIONS: {
  value: CoordinateFormat;
  label: string;
  example: string;
}[] = [
  {
    value: "dd",
    label: "Decimal Degrees",
    example: "25.5941° N · 85.1376° E",
  },
  {
    value: "dms",
    label: "DMS",
    example: "25°35′39″ N · 85°08′15″ E",
  },
];

function SegmentedButton({
  active,
  onClick,
  label,
  hint,
  note,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-md border px-3 py-2.5 text-left transition ${
        active
          ? "border-amber-400/60 bg-amber-500/10"
          : "border-[#1c2740] bg-surface-muted/40 hover:border-amber-400/40"
      }`}
    >
      <p
        className={`text-sm font-semibold ${active ? "text-amber-200" : "text-slate-300"}`}
      >
        {label}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p>}
      {note && (
        <p className="mt-0.5 text-[10px] font-medium text-slate-500">{note}</p>
      )}
    </button>
  );
}

export default function UnitPreferences() {
  const { settings, update } = useMapSettings();
  const display = settings.display;

  function setUnits(units: MapUnits) {
    update({ display: { ...display, units } });
  }

  function setCoordinateFormat(format: CoordinateFormat) {
    update({ display: { ...display, coordinateFormat: format } });
  }

  return (
    <div className="mt-5 space-y-5">
      {/* Distance & Elevation Units */}
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Scale3D className="h-3.5 w-3.5" aria-hidden />
          Distance &amp; Elevation Units
        </p>
        <div
          className="mt-2 flex gap-2"
          role="group"
          aria-label="Distance and elevation units"
        >
          {UNIT_OPTIONS.map((option) => (
            <SegmentedButton
              key={option.value}
              active={display.units === option.value}
              onClick={() => setUnits(option.value)}
              label={option.label}
              hint={option.hint}
              note={option.note}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Formats distances, elevation and windspeed on the main map&apos;s
          routing engine across all assigned resources.
        </p>
      </div>

      {/* Coordinate Format */}
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <LocateFixed className="h-3.5 w-3.5" aria-hidden />
          Coordinate Format
        </p>
        <div
          className="mt-2 flex gap-2"
          role="group"
          aria-label="Coordinate format"
        >
          {COORD_OPTIONS.map((option) => (
            <SegmentedButton
              key={option.value}
              active={display.coordinateFormat === option.value}
              onClick={() => setCoordinateFormat(option.value)}
              label={option.label}
              hint={option.example}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Controls how coordinates render in position readouts, dispatch and
          field reports.
        </p>
      </div>
    </div>
  );
}