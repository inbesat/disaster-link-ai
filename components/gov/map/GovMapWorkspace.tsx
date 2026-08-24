"use client";

// ---------------------------------------------------------------------
// components/gov/map/GovMapWorkspace.tsx — Phase 8 · Steps 1–4.
//
// The full-screen Gov Map Workspace: h-screen/w-screen, zero dashboard
// chrome, glassmorphism header overlay, floating layer control, legend
// panel, measurement toolbar, time slider, and export button.
// ---------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type maplibregl from "maplibre-gl";
import {
  ArrowLeft,
  Layers,
  MapPin,
  Mountain,
  Search,
  ShieldCheck,
  Signal,
  Info,
} from "lucide-react";
import type { MeasureMode } from "@/lib/map/gov-measurements";
import { GovMapLayersProvider } from "./GovMapLayersContext";
import GovMapCanvas from "./GovMapCanvas";
import AdvancedLayerControl from "./AdvancedLayerControl";
import LegendPanel from "./LegendPanel";
import MeasurementToolbar from "./MeasurementToolbar";
import TimeSliderControl from "./TimeSliderControl";
import ExportMapButton from "./ExportMapButton";

export function GovMapWorkspace() {
  const [measureMode, setMeasureMode] = useState<MeasureMode | null>(null);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [forecastHour, setForecastHour] = useState(24);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [is3D, setIs3D] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

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

        {/* ── Glassmorphism Header (Task 1) ── */}
        <header className="absolute top-0 left-0 right-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0a0f1a]/80 px-4 backdrop-blur-md">
          {/* Back button */}
          <Link
            href="/gov/dashboard"
            aria-label="Back to command center"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 hover:scale-[1.02] active:scale-95"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4 text-blue-400" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          {/* District name + live badge */}
          <div className="flex items-center gap-2.5">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Patna District</span>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[0.625rem] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              LIVE
            </span>
          </div>

          {/* Search bar */}
          <div className="relative ml-auto hidden md:block">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search locations…"
              className="h-9 w-56 rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-1 focus:ring-blue-400/30"
            />
          </div>

          {/* Layer toggle + 3D + Export */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggle3D}
              aria-pressed={is3D}
              aria-label="Toggle 3D view"
              title="Toggle 3D view"
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                is3D
                  ? "border-blue-400/50 bg-blue-500/20 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              <Mountain aria-hidden="true" className="h-3.5 w-3.5" />
              3D
            </button>
            <ExportMapButton getMap={() => mapRef.current} />
          </div>
        </header>

        {/* Step 4 — measurement toolbar (left, vertical). */}
        <MeasurementToolbar
          mode={measureMode}
          onChange={handleModeChange}
          pointCount={measurePoints.length}
          onClear={() => setMeasurePoints([])}
        />

        {/* Step 5 — the 72-hour predictive time slider (bottom centre). */}
        <TimeSliderControl hour={forecastHour} onChange={setForecastHour} />

        {/* Step 2 — the data layer control panel (right, collapsible). */}
        <AdvancedLayerControl />

        {/* Legend toggle button (bottom-left) */}
        <button
          type="button"
          onClick={() => setShowLegend((v) => !v)}
          aria-label="Toggle legend"
          className="absolute bottom-4 left-4 z-30 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111827]/90 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-[#111827] hover:scale-[1.02] active:scale-95"
        >
          <Info aria-hidden="true" className="h-3.5 w-3.5 text-blue-400" />
          Legend
        </button>

        {/* Legend Panel (Task 3) */}
        {showLegend && <LegendPanel onClose={() => setShowLegend(false)} />}

        {/* Title chip — bottom right */}
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-[#0a0f1a]/80 px-3 py-1.5 text-[0.6875rem] font-medium text-white/80 backdrop-blur">
          <Signal aria-hidden="true" className="h-3.5 w-3.5 text-blue-400" />
          GOV OPERATIONS MAP
        </div>
      </div>
    </GovMapLayersProvider>
  );
}

export default GovMapWorkspace;
