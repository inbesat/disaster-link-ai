"use client";

// ---------------------------------------------------------------------
// components/gov/map/MeasurementToolbar.tsx — Phase 8 · Step 4 ·
// Measurement Toolbar (Turf.js).
//
// Vertical floating toolbar pinned to the LEFT edge of the Gov Map, above
// the drawing controls. Two GIS tools:
//   • Ruler   → Distance — click the map to drop waypoints; the path
//               length is computed with @turf/length (kilometers).
//   • Polygon → Area — click ≥3 points; the closed polygon's area is
//               computed with @turf/area (sq km).
// While a tool is active, the map shows the live shape + a floating
// readout near the cursor (rendered by GovMapCanvas). The toolbar itself
// is purely presentational — it writes the active mode into the same
// context the canvas reads.
// ---------------------------------------------------------------------

import { Hexagon, Ruler, X } from "lucide-react";
import type { MeasureMode } from "@/lib/map/gov-measurements";

type MeasurementToolbarProps = {
  /** Active tool (null = idle). */
  mode: MeasureMode | null;
  onChange: (mode: MeasureMode | null) => void;
  /** Points collected so far — enables the Clear button. */
  pointCount: number;
  onClear: () => void;
};

const TOOLS: Array<{ id: MeasureMode; label: string; hint: string; icon: typeof Ruler }> = [
  { id: "distance", label: "Measure distance", hint: "Click to drop waypoints · km", icon: Ruler },
  { id: "area", label: "Measure area", hint: "Click 3+ points · km²", icon: Hexagon },
];

export function MeasurementToolbar({
  mode,
  onChange,
  pointCount,
  onClear,
}: MeasurementToolbarProps) {
  return (
    <div className="absolute left-3 top-20 z-50 flex flex-col gap-2">
      {TOOLS.map((tool) => {
        const active = mode === tool.id;
        return (
          <span key={tool.id} className="group relative flex items-center">
            <button
              type="button"
              aria-pressed={active}
              aria-label={tool.label}
              title={tool.label}
              onClick={() => onChange(active ? null : tool.id)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border backdrop-blur-md transition hover:scale-105 active:scale-95 ${
                active
                  ? "border-blue-400/50 bg-blue-500/20 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                  : "border-white/10 bg-[#111827]/90 text-slate-400 hover:bg-[#111827] hover:text-white"
              }`}
            >
              <tool.icon aria-hidden="true" className="h-5 w-5" />
            </button>

            {/* Tooltip */}
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg border border-white/10 bg-[#111827]/95 px-3 py-1.5 opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100">
              <span className="block text-xs font-semibold text-white">{tool.label}</span>
              <span className="block text-[0.625rem] text-slate-500">{tool.hint}</span>
            </span>
          </span>
        );
      })}

      {pointCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear measurement"
          title="Clear measurement"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/40 bg-red-400/15 text-red-300 backdrop-blur-md transition hover:bg-red-400/25 active:scale-95"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default MeasurementToolbar;
