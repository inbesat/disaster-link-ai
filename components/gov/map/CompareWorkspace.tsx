"use client";

// ---------------------------------------------------------------------
// components/gov/map/CompareWorkspace.tsx — Phase 8 · Step 9 ·
// Split-Screen Comparison Mode.
//
// Two MapLibre maps side-by-side (50% each) comparing:
//   • LEFT  — "NORMAL / CURRENT" — the base flood forecast + current
//             operational layers.
//   • RIGHT — "EXTREME +72H" — the critical-severity, full-horizon
//             scenario flood (wider, deeper zones from
//             extremeScenarioFloodGeoJson).
//
// The maps are synchronized through a single controlled viewState: both
// get the same { latitude, longitude, zoom, bearing, pitch } props and
// both write back to the same state on move — so panning/zooming either
// pane moves the other to the exact same camera.
//
// Loaded client-only (ssr: false) from app/gov/map/compare/page.tsx
// because maplibre-gl touches `window`.
// ---------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ArrowLeft, Columns2 } from "lucide-react";
import { AttributionControl, Layer, Map, Source } from "react-map-gl/maplibre";
import type { FeatureCollection, Geometry, Polygon } from "geojson";
import {
  extremeScenarioFloodGeoJson,
  GOV_CROWD_REPORTS,
  GOV_EVACUATION_ROUTES,
  GOV_MAP_INITIAL_VIEW,
  GOV_RESPONDER_POSITIONS,
  GOV_RESOURCE_DEPOTS,
  GOV_ROAD_CLOSURES,
  govFloodZonesGeoJson,
  govSheltersGeoJson,
  pointsToGeoJson,
  routesToGeoJson,
} from "@/lib/map/gov-map-layers";

/** Carto dark-matter — the codebase-wide dark base layer. */
const CARTO_DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type GovLayerGeoJson = FeatureCollection<Geometry>;

/** The shared camera — both panes render this exact viewState. */
type SyncViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
};

/** Builders run once for stable source refs (mirrors the ops map). */
const NORMAL_FLOOD: FeatureCollection<Polygon> = govFloodZonesGeoJson();
const EXTREME_FLOOD: FeatureCollection<Polygon> = extremeScenarioFloodGeoJson();
const SHELTERS = govSheltersGeoJson();
const ROUTES = routesToGeoJson(GOV_EVACUATION_ROUTES);
const DEPOTS = pointsToGeoJson(GOV_RESOURCE_DEPOTS);
const RESPONDERS = pointsToGeoJson(GOV_RESPONDER_POSITIONS);
const CLOSURES = pointsToGeoJson(GOV_ROAD_CLOSURES);
const REPORTS = pointsToGeoJson(GOV_CROWD_REPORTS);

export function CompareWorkspace() {
  const [viewState, setViewState] = useState<SyncViewState>({
    latitude: GOV_MAP_INITIAL_VIEW.latitude,
    longitude: GOV_MAP_INITIAL_VIEW.longitude,
    zoom: GOV_MAP_INITIAL_VIEW.zoom,
    bearing: 0,
    pitch: 0,
  });

  const sync = (vs: SyncViewState) => setViewState(vs);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0f1a]">
      {/* Two 50%-wide panes sharing the one camera. */}
      <div className="flex h-full w-full">
        <ComparePane
          title="NORMAL / CURRENT"
          caption="Base forecast · live layers"
          accent="#5b8df6"
          floodData={NORMAL_FLOOD}
          floodOpacity={0.4}
          viewState={viewState}
          onMove={sync}
        />
        <ComparePane
          title="EXTREME +72H"
          caption="Critical severity · 72h horizon"
          accent="#f43f5e"
          floodData={EXTREME_FLOOD}
          floodOpacity={0.62}
          viewState={viewState}
          onMove={sync}
        />
      </div>

      {/* Floating "Scenario Comparison Mode" header — top centre. */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-[#0d1526]/90 px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur">
          <Columns2 aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/85">
            Scenario Comparison Mode
          </p>
        </div>
      </div>

      {/* Back to the ops map — top left. */}
      <Link
        href="/gov/map"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#0d1526]/85 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur transition hover:scale-[1.03] hover:bg-[#0d1526] active:scale-95"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
        Ops Map
      </Link>
    </div>
  );
}

/** One 50% pane — same layers, different scenario flood data. */
function ComparePane({
  title,
  caption,
  accent,
  floodData,
  floodOpacity,
  viewState,
  onMove,
}: {
  title: string;
  caption: string;
  accent: string;
  floodData: FeatureCollection<Polygon>;
  floodOpacity: number;
  viewState: SyncViewState;
  onMove: (vs: SyncViewState) => void;
}) {
  return (
    <div className="relative h-full w-1/2 border-r border-white/10 last:border-r-0">
      <Map
        mapLib={maplibregl}
        mapStyle={CARTO_DARK_STYLE}
        latitude={viewState.latitude}
        longitude={viewState.longitude}
        zoom={viewState.zoom}
        bearing={viewState.bearing}
        pitch={viewState.pitch}
        onMove={(e) => onMove(e.viewState)}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <AttributionControl
          position="bottom-right"
          compact
          style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}
        />

        {/* Scenario flood — the pane's differentiator. */}
        <Source id="pane-flood" type="geojson" data={floodData}>
          <Layer
            id="pane-flood-fill"
            type="fill"
            paint={{ "fill-color": accent, "fill-opacity": floodOpacity }}
          />
          <Layer
            id="pane-flood-outline"
            type="line"
            paint={{ "line-color": accent, "line-width": 1.5, "line-opacity": 0.9 }}
          />
        </Source>

        {/* Shared operational layers — same on both panes. */}
        <Source id="pane-routes" type="geojson" data={ROUTES}>
          <Layer
            id="pane-routes-line"
            type="line"
            paint={{
              "line-color": "#22d3ee",
              "line-width": 3,
              "line-dasharray": [4, 3],
              "line-opacity": 0.9,
            }}
          />
        </Source>
        <PanePoints id="pane-shelters" data={SHELTERS} color="#10b981" radius={7} />
        <PanePoints id="pane-depots" data={DEPOTS} color="#f59e0b" radius={6} />
        <PanePoints id="pane-responders" data={RESPONDERS} color="#8b5cf6" radius={5} />
        <PanePoints id="pane-closures" data={CLOSURES} color="#ef4444" radius={5} />
        <PanePoints id="pane-reports" data={REPORTS} color="#f472b6" radius={5} />
      </Map>

      {/* Pane badge — top left of the pane. */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-white/15 bg-[#0d1526]/90 px-3 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur">
        <span className="flex items-center gap-1.5 text-[0.6875rem] font-bold tracking-wider text-white/90">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
          {title}
        </span>
        <span className="mt-0.5 block text-[0.5625rem] uppercase tracking-wide text-white/40">
          {caption}
        </span>
      </div>
    </div>
  );
}

/** A simple circle point layer for one shared layer on a compare pane. */
function PanePoints({
  id,
  data,
  color,
  radius,
}: {
  id: string;
  data: GovLayerGeoJson;
  color: string;
  radius: number;
}) {
  return (
    <Source id={id} type="geojson" data={data}>
      <Layer
        id={`${id}-dot`}
        type="circle"
        paint={{
          "circle-color": color,
          "circle-radius": radius,
          "circle-opacity": 0.9,
          "circle-stroke-color": "#0a0f1a",
          "circle-stroke-width": 1.5,
        }}
      />
    </Source>
  );
}

export default CompareWorkspace;
