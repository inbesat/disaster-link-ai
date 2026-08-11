"use client";

// ---------------------------------------------------------------------
// components/field/FieldRouteMap.tsx — Phase 14 · Step 8.
//
// Route-aware field navigation:
//   • Full-screen MapLibre (Carto dark-matter — same base as the gov
//     DisasterMap) centred on the responder's live GPS (Patna fallback).
//   • The current task destination is overlaid as a marker.
//   • A mock OSRM route (GeoJSON line) is drawn from the responder to the
//     task. When a Command-Center road closure falls near the route, the
//     segment is dropped and a dynamic REROUTE path is drawn in amber.
//   • A large "Turn Left in 500m" navigation header pins to the top.
//
// Loaded client-only (next/dynamic, ssr: false) from the page because
// maplibre-gl touches `window` — the codebase-wide map convention.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AttributionControl,
  Layer,
  Map,
  Marker,
  Source,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";
import { LocateFixed, ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import { PATNA_CENTER } from "@/lib/field-offline";

const CARTO_DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Current task destination — Shelter X (matches the urgent task card).
const DEST = { lat: 25.5989, lng: 85.1492, label: "Shelter X" };

// Mock OSRM-style route from the responder origin to the destination.
function buildRoute(lat: number, lng: number) {
  return [
    [lng, lat],
    [lng + 0.004, lat + 0.001],
    [lng + 0.009, lat + 0.002],
    [lng + 0.013, lat + 0.004],
    [DEST.lng, DEST.lat],
  ] as [number, number][];
}

// Command-center road closure pinched onto the route — forces a reroute.
const CLOSURE = { lat: 25.5995, lng: 85.1435, reason: "Under water" };

// Amber detour that routes around the closure.
const REROUTE: [number, number][] = [
  [85.1426, 25.5961],
  [85.1456, 25.5961],
  [85.1506, 25.5989],
  [DEST.lng, DEST.lat],
];

export default function FieldRouteMap() {
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  // Grab the responder's live position once; fall back to the demo centre.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGps(PATNA_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGps(PATNA_CENTER),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  }, []);

  const origin = gps ?? PATNA_CENTER;
  const route = useMemo(() => buildRoute(origin.lat, origin.lng), [origin]);

  const routeSource = useMemo(
    () => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: route },
    }),
    [route],
  );

  const rerouteSource = useMemo(
    () => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: REROUTE },
    }),
    [],
  );

  function recenter() {
    triggerLightHaptic();
    mapRef.current?.flyTo({ center: [origin.lng, origin.lat], zoom: 15 });
  }

  return (
    <div className="relative -mx-4 -mt-6 h-[calc(100dvh-8.5rem)] w-[calc(100%+2rem)] overflow-hidden">
      <Map
        mapLib={maplibregl}
        mapStyle={CARTO_DARK_STYLE}
        initialViewState={{
          latitude: origin.lat,
          longitude: origin.lng,
          zoom: 14,
        }}
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <AttributionControl
          position="top-right"
          compact
          style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}
        />
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Primary route (cyan) */}
        <Source id="route" type="geojson" data={routeSource}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": "#22d3ee",
              "line-width": 5,
              "line-opacity": 0.9,
            }}
          />
        </Source>

        {/* Reroute (amber) — drawn because a road on the route is closed */}
        <Source id="reroute" type="geojson" data={rerouteSource}>
          <Layer
            id="reroute-line"
            type="line"
            paint={{
              "line-color": "#f59e0b",
              "line-width": 4,
              "line-dasharray": [2, 1.5],
            }}
          />
        </Source>

        {/* Task destination marker */}
        <Marker longitude={DEST.lng} latitude={DEST.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-300 bg-cyan-500/25 text-xl">
              🏥
            </span>
            <span className="mt-0.5 rounded-full bg-black/70 px-2 py-0.5 text-[0.6875rem] font-bold text-cyan-200">
              {DEST.label}
            </span>
          </div>
        </Marker>

        {/* Responder live dot */}
        <Marker longitude={origin.lng} latitude={origin.lat} anchor="center">
          <span className="flex h-4 w-4 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
        </Marker>

        {/* Road closure pin */}
        <Marker longitude={CLOSURE.lng} latitude={CLOSURE.lat} anchor="bottom">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-red-400 bg-red-500/25 text-lg">
            🚧
          </span>
        </Marker>
      </Map>

      {/* Big navigation header — "Turn Left in 500m" */}
      <div className="absolute inset-x-0 top-0 z-10 border-b-2 border-amber-400/60 bg-[#0A0F1D]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-500/15 text-cyan-300">
            <ChevronLeft className="h-7 w-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-2xl font-black text-cyan-200">Turn Left in 500m</p>
            <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-slate-400">
              Route Y → Shelter X · ETA 6 min
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-500/15 text-amber-300">
            <ChevronRight className="h-7 w-7" aria-hidden />
          </span>
        </div>

        {/* Reroute notice */}
        <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/10 px-2 py-1 text-[0.8125rem] font-bold text-amber-300">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
          Road closed ahead (under water) — rerouted via Kankarbagh Lowlands
        </p>
      </div>

      {/* Recenter FAB */}
      <button
        type="button"
        onClick={recenter}
        aria-label="Recentre on my location"
        className="absolute bottom-6 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-cyan-400/60 bg-[#0A0F1D]/90 text-cyan-300 backdrop-blur transition active:scale-95"
      >
        <LocateFixed className="h-6 w-6" />
      </button>
    </div>
  );
}
