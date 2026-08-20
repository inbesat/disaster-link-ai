"use client";

// ---------------------------------------------------------------------
// components/settings/MapSettingsWrapper.tsx — Map & GIS (Phase 3 · Step 1).
//
// Responsive, scrollable layout for /settings/map. Renders the nine
// configuration sections side-by-side on wide screens and stacked on
// mobile, all bound to the shared MapSettingsContext so every change is
// immediately reflected on the /dashboard command-center map.
//
// The page header text is owned by this wrapper (server page carries the
// route metadata + Navigates straight here).
// ---------------------------------------------------------------------

import { Layers, Map as MapIcon, RotateCcw } from "lucide-react";
import MapDefaultViewCard from "@/components/settings/map/DefaultViewCard";
import LayerVisibilityCard from "@/components/settings/map/LayerVisibilityCard";
import OpacityControlsCard from "@/components/settings/map/OpacityControlsCard";
import DataRefreshCard from "@/components/settings/map/DataRefreshCard";
import MapDisplayOptionsCard from "@/components/settings/MapDisplayOptionsCard";
import MapRefreshCacheCard from "@/components/settings/MapRefreshCacheCard";
import OfflineCacheCard from "@/components/settings/map/OfflineCacheCard";
import PerformanceSettingsCard from "@/components/settings/map/PerformanceSettingsCard";
import AccessibilityCard from "@/components/settings/map/AccessibilityCard";
import { useMapPreferences } from "@/lib/map-settings-store";

export default function MapSettingsWrapper() {
  const { reset } = useMapPreferences();

  return (
    <div className="space-y-6" data-settings-scope="map">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eoc-label flex items-center gap-2 text-cyan-400/90">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            SETTINGS / MAP &amp; DISPLAY
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Map &amp; GIS Settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Configure your tactical display and data layers.
          </p>
        </div>
      </div>

      {/* Section 1 — Default View (full width) + Section 2 — Layers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MapDefaultViewCard />
        <LayerVisibilityCard />
      </div>

      {/* Section 2 — Flood Zone Opacity (full width) */}
      <OpacityControlsCard />

      {/* Section 3 — Live Data Refresh Rate (full width) */}
      <DataRefreshCard />

      {/* Section 4 — Display Options + Section 5 — Refresh & Offline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MapDisplayOptionsCard />
        <MapRefreshCacheCard />
      </div>

      {/* Section 6 — Offline Map Cache Manager (full width) */}
      <OfflineCacheCard />

      {/* Section 7 — Animation & Performance */}
      <PerformanceSettingsCard />

      {/* Section 8 — Colorblind & Contrast (full width) */}
      <AccessibilityCard />

      {/* Stripped footer summary bar */}
      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-eoc border border-panel-border bg-surface-muted/40 p-4">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <MapIcon className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
          Live-preview your tactical configuration on the command-center map.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-md border border-panel-borderHover bg-[#0a0f1d] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset all map settings
        </button>
      </footer>
    </div>
  );
}