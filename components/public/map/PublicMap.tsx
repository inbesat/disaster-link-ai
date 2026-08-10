"use client";

// ---------------------------------------------------------------------
// components/public/map/PublicMap.tsx — Phase 4 · Step 1 · Minimalist
// panic-proof citizen map.
//
// A full-viewport MapLibre map (react-map-gl) with ZERO chrome: no zoom
// controls, no measure tools, no layer panels, no search bar — just the
// base layer, the user's location pin + Locate Me FAB (Step 2), a tiny
// area chip in the corner, and the minimal legal attribution (moved to
// the top right so the fixed BottomNav doesn't hide it).
//
// Same Carto dark-matter style as the gov DisasterMap; the camera opens
// on the citizen's saved location (GPS fix, manual district centroid, or
// Patna by default).
//
// Loaded client-only (ssr: false) from the page because maplibre-gl
// touches `window` — same convention as DisasterMap / MiniMapCanvas.
// ---------------------------------------------------------------------

import { useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AttributionControl, Map } from "react-map-gl/maplibre";
import { MapPin } from "lucide-react";
import { readCitizenLocation } from "@/hooks/useSafetyStatus";
import { resolveCitizenMapView } from "@/lib/map/citizen-view";
import type { CitizenMapView } from "@/lib/map/citizen-view";
import UserLocationDot from "./UserLocationDot";

/** Carto dark-matter — same base layer the gov DisasterMap uses. */
const CARTO_DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function PublicMap() {
  const view = useMemo<CitizenMapView>(
    () => resolveCitizenMapView(readCitizenLocation()),
    [],
  );

  return (
    <div className="relative h-full w-full">
      <Map
        mapLib={maplibregl}
        mapStyle={CARTO_DARK_STYLE}
        initialViewState={{
          latitude: view.center.lat,
          longitude: view.center.lng,
          zoom: view.zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        // We render our own attribution at the top right so the fixed
        // BottomNav at the bottom doesn't hide the legal credit.
        attributionControl={false}
      >
        <AttributionControl
          position="top-right"
          compact
          style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}
        />
        <UserLocationDot />
      </Map>

      {/* Area chip — subtle readout of where the map is centred,
          positioned above the BottomNav */}
      <p className="pointer-events-none absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 z-10 flex items-center gap-1.5 rounded-full bg-[#0a1120]/70 px-3 py-1.5 text-xs font-medium text-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-sm">
        <MapPin aria-hidden="true" className="h-3 w-3 shrink-0 text-[var(--dl-orange)]" />
        {view.label}
      </p>
    </div>
  );
}