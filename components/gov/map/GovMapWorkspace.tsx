"use client";

// ---------------------------------------------------------------------
// components/gov/map/GovMapWorkspace.tsx — Phase 8 · Steps 1–4.
//
// The full-screen Gov Map Workspace: h-screen/w-screen, zero dashboard
// chrome (no sidebar, no top/bottom nav — this route deliberately has
// no shell layout), a floating "Back to Dashboard" button top-left, the
// 100% MapLibre canvas, the AdvancedLayerControl docked right, and the
// MeasurementToolbar + MapboxDraw annotation tools (Steps 3–4).
//
// Measurement state lives here (lifted) so the toolbar and the canvas
// share it: the toolbar toggles the active tool, the canvas consumes
// clicks and renders the live shape + readout.
//
// Loaded client-only from app/gov/map/page.tsx via next/dynamic (ssr:
// false) because maplibre-gl touches `window`.
// ---------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type maplibregl from "maplibre-gl";
import { ArrowLeft, Mountain, ShieldCheck } from "lucide-react";
import type { MeasureMode } from "@/lib/map/gov-measurements";
import { GovMapLayersProvider } from "./GovMapLayersContext";
import GovMapCanvas from "./GovMapCanvas";
import AdvancedLayerControl from "./AdvancedLayerControl";
import MeasurementToolbar from "./MeasurementToolbar";
import TimeSliderControl from "./TimeSliderControl";
import ExportMapButton from "./ExportMapButton";

export function GovMapWorkspace() {
  // Step 4 — active measurement tool + collected waypoints (shared with
  // the canvas via props; switching tool or clearing resets the points).
  const [measureMode, setMeasureMode] = useState<MeasureMode | null>(null);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  // Step 5 — 72-hour forecast cursor (owned here, shared with the canvas
  // which scales the flood polygons; starts at t24 = base extent).
  const [forecastHour, setForecastHour] = useState(24);
  // Step 7 — live map instance (set on load; used by the 3D toggle and
  // the Step 8 export button).
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [is3D, setIs3D] = useState(false);

  const handleMapReady = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
  }, []);

  const toggle3D = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = !is3D;
    map.easeTo({ pitch: next ? 60 : 0, duration: 900 });
    setIs3D(next);
  }, [is3D]);

  const handleModeChange = useCallback((mode: MeasureMode | null) => {
    setMeasureMode(mode);
    setMeasurePoints([]);
  }, []);

  const handleAddPoint = useCallback((lngLat: { lng: number; lat: number }) => {
    setMeasurePoints((prev) => [...prev, [lngLat.lng, lngLat.lat]]);
  }, []);

  return (
    <GovMapLayersProvider>
      <div className="gov-ops-map relative h-screen w-screen overflow-hidden bg-[#0a0f1a]">
        {/* 100% screen map canvas */}
        <div className="absolute inset-0">
          <GovMapCanvas
            measureMode={measureMode}
            measurePoints={measurePoints}
            onAddMeasurePoint={handleAddPoint}
            forecastHour={forecastHour}
            onMapReady={handleMapReady}
          />
        </div>

        {/* Floating "Back to Dashboard" — top left */}
        <Link
          href="/gov/dashboard"
          className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#0d1526]/85 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur transition hover:bg-[#0d1526] hover:scale-[1.03] active:scale-95"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
          Back to Dashboard
        </Link>

        {/* Step 4 — measurement toolbar (left, vertical). */}
        <MeasurementToolbar
          mode={measureMode}
          onChange={handleModeChange}
          pointCount={measurePoints.length}
          onClear={() => setMeasurePoints([])}
        />

        {/* Steps 7–8 — top-right toolbar: 3D pitch toggle + export. */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={toggle3D}
            aria-pressed={is3D}
            aria-label="Toggle 3D view"
            title="Toggle 3D view (60° pitch)"
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold backdrop-blur transition hover:scale-[1.03] active:scale-95 ${
              is3D
                ? "border-[var(--dl-blue-light)] bg-[var(--dl-blue)]/30 text-[var(--dl-blue-light)] shadow-[0_0_16px_rgba(91,141,246,0.4)]"
                : "border-white/15 bg-[#0d1526]/85 text-white hover:bg-[#0d1526]"
            }`}
          >
            <Mountain aria-hidden="true" className="h-4 w-4" />
            3D
          </button>
          <ExportMapButton getMap={() => mapRef.current} />
        </div>

        {/* Step 5 — the 72-hour predictive time slider (bottom centre). */}
        <TimeSliderControl hour={forecastHour} onChange={setForecastHour} />

        {/* Step 2 — the data layer control panel (right, collapsible). */}
        <AdvancedLayerControl />

        {/* Title chip — bottom left, over the attribution. */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full bg-[#0d1526]/80 px-3 py-1.5 text-[0.6875rem] font-medium text-white/80 backdrop-blur">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-[var(--dl-blue-light)]" />
          GOV OPERATIONS MAP · PATNA
        </div>
      </div>
    </GovMapLayersProvider>
  );
}

export default GovMapWorkspace;
