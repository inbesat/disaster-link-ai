// ---------------------------------------------------------------------
// lib/map/gov-map-layers.ts — Phase 8 · Step 2 · Gov Map layer catalog.
//
// Pure, SSR-safe definitions for the seven data layers the Gov Map
// Workspace can render. Everything here is plain data + builder
// functions (no React, no `window`) so the catalog and mock geometry
// are unit-testable and the context/canvas just consume them.
//
// Each layer = a key, a human label, a color and (for the control
// panel) a default visibility + opacity. The map canvas renders a
// GeoJSON source per layer; the AdvancedLayerControl reads/writes the
// same state through GovMapLayersContext.
// ---------------------------------------------------------------------

import { generateFloodPolygons } from "@/lib/map/flood-geojson";
import { CITIZEN_SHELTERS } from "@/lib/map/citizen-shelters";
import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";

/** The seven operational layers. */
export const GOV_MAP_LAYER_KEYS = [
  "floodRiskZones",
  "shelters",
  "resourceDepots",
  "evacuationRoutes",
  "responderPositions",
  "roadClosures",
  "crowdReports",
] as const;

export type GovMapLayerKey = (typeof GOV_MAP_LAYER_KEYS)[number];

/** Per-layer defaults the control panel ships with. */
export type GovLayerState = {
  visible: boolean;
  /** 0–100 (the slider range); map paint opacities use /100. */
  opacity: number;
};

export const DEFAULT_GOV_LAYER_STATES: Record<GovMapLayerKey, GovLayerState> = {
  floodRiskZones: { visible: true, opacity: 55 },
  shelters: { visible: true, opacity: 90 },
  resourceDepots: { visible: true, opacity: 80 },
  evacuationRoutes: { visible: true, opacity: 75 },
  responderPositions: { visible: true, opacity: 90 },
  roadClosures: { visible: true, opacity: 90 },
  crowdReports: { visible: false, opacity: 60 },
};

export const GOV_LAYER_LABELS: Record<GovMapLayerKey, string> = {
  floodRiskZones: "Flood Risk Zones",
  shelters: "Shelters",
  resourceDepots: "Resource Depots",
  evacuationRoutes: "Evacuation Routes",
  responderPositions: "Responder Positions",
  roadClosures: "Road Closures",
  crowdReports: "Crowdsourced Reports",
};

/** Display colour per layer (SVG/MapLibre hex). */
export const GOV_LAYER_COLORS: Record<GovMapLayerKey, string> = {
  floodRiskZones: "#3b82f6",
  shelters: "#10b981",
  resourceDepots: "#f59e0b",
  evacuationRoutes: "#22d3ee",
  responderPositions: "#8b5cf6",
  roadClosures: "#ef4444",
  crowdReports: "#f472b6",
};

/** Default camera for the Gov Map Workspace (Patna, the demo district). */
export const GOV_MAP_INITIAL_VIEW = {
  latitude: 25.594,
  longitude: 85.137,
  zoom: 11.4,
};

// ---------------------------------------------------------------------
// Mock geometry — Patna-flavoured, mirroring the citizen map data.
// ---------------------------------------------------------------------

/** Flood zones generated around the demo district centre (pure, seeded). */
export function govFloodZonesGeoJson(): FeatureCollection<Polygon> {
  return generateFloodPolygons(GOV_MAP_INITIAL_VIEW.latitude, GOV_MAP_INITIAL_VIEW.longitude, "high", 24);
}

/** Shelters → point features (from the shared citizen shelter data). */
export function govSheltersGeoJson(): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: CITIZEN_SHELTERS.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      properties: { name: s.name, capacity: s.capacity, occupancy: s.occupancy },
    })),
  };
}

type LatLng = { id: string; name: string; lat: number; lng: number };

/** Mock resource depots (boats, tents, medical staging). */
export const GOV_RESOURCE_DEPOTS: LatLng[] = [
  { id: "d1", name: "NH-01 Staging Point", lat: 25.618, lng: 85.102 },
  { id: "d2", name: "Danapur Depot", lat: 25.64, lng: 85.052 },
  { id: "d3", name: "Kankarbagh Warehouse", lat: 25.589, lng: 85.191 },
  { id: "d4", name: "Medical Hub · PMCH", lat: 25.6, lng: 85.152 },
];

/** Mock evacuation route polylines (origin → shelter). */
export const GOV_EVACUATION_ROUTES: Array<{ id: string; name: string; path: [number, number][] }> = [
  {
    id: "r1",
    name: "Sector 4 → Kankarbagh Stadium",
    path: [
      [85.118, 25.575],
      [85.13, 25.581],
      [85.152, 25.586],
      [85.19, 25.589],
    ],
  },
  {
    id: "r2",
    name: "Gandhi Maidan → Central Hall",
    path: [
      [85.14, 25.613],
      [85.152, 25.611],
      [85.164, 25.609],
    ],
  },
  {
    id: "r3",
    name: "Danapur → Relief Camp",
    path: [
      [85.03, 25.622],
      [85.04, 25.626],
      [85.048, 25.63],
    ],
  },
];

/** Mock live responder positions. */
export const GOV_RESPONDER_POSITIONS: LatLng[] = [
  { id: "u2", name: "Unit 2 · Active Rescue", lat: 25.587, lng: 85.144 },
  { id: "u3", name: "Unit 3 · On Scene", lat: 25.608, lng: 85.17 },
  { id: "u4", name: "Unit 4 · En Route", lat: 25.602, lng: 85.115 },
  { id: "u1", name: "Unit 1 · Returning", lat: 25.598, lng: 85.155 },
];

/** Mock road closures (barricades). */
export const GOV_ROAD_CLOSURES: LatLng[] = [
  { id: "c1", name: "Bailey Road · waterlogged", lat: 25.579, lng: 85.161 },
  { id: "c2", name: "Danapur stretch submerged", lat: 25.628, lng: 85.06 },
  { id: "c3", name: "NH-31 slip near Mokama", lat: 25.552, lng: 85.091 },
];

/** Mock unverified crowdsourced reports. */
export const GOV_CROWD_REPORTS: LatLng[] = [
  { id: "p1", name: "Road blocked in Sector 4", lat: 25.585, lng: 85.139 },
  { id: "p2", name: "Water entering ground floor", lat: 25.593, lng: 85.149 },
  { id: "p3", name: "Power line down", lat: 25.604, lng: 85.126 },
];

/** Points → point FeatureCollection (depots / responders / closures / reports). */
export function pointsToGeoJson(points: LatLng[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { name: p.name },
    })),
  };
}

/** Polylines → line FeatureCollection (evacuation routes). */
export function routesToGeoJson(
  routes: Array<{ id: string; name: string; path: [number, number][] }>,
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: routes.map((r) => ({
      type: "Feature",
      geometry: { type: "LineString", coordinates: r.path },
      properties: { name: r.name },
    })),
  };
}

// ---------------------------------------------------------------------
// Phase 8 · Step 9–10 — scenario + crowd-report point cloud builders.
// ---------------------------------------------------------------------

/** Deterministic PRNG (mirrors flood-geojson's seeded()) so the generated
 * point cloud is stable across renders. */
function crowdSeeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * A large seeded crowd-report point cloud around the district centre —
 * powers the gov map's marker-clustering demo (thousands of incident
 * reports rendered as a handful of clusters at 60fps). Deterministic:
 * the same count always produces the same cloud.
 */
export function crowdReportsGeoJson(count = 3000): FeatureCollection<Point> {
  const { latitude, longitude } = GOV_MAP_INITIAL_VIEW;
  const features: Feature<Point>[] = [];
  for (let i = 0; i < count; i++) {
    const km = 0.2 + crowdSeeded(i * 1.7 + latitude * 1000) * 6.5;
    const angle = crowdSeeded(i * 3.1 + longitude * 1000) * Math.PI * 2;
    const lat = latitude + (km * Math.cos(angle)) / 111;
    const lng =
      longitude + (km * Math.sin(angle)) / (111 * Math.cos((latitude * Math.PI) / 180));
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [Number(lng.toFixed(5)), Number(lat.toFixed(5))],
      },
      properties: { name: `Crowd report ${i + 1}` },
    });
  }
  return { type: "FeatureCollection", features };
}

/** The +72h EXTREME scenario flood — critical severity at the full forecast
 * horizon (wider, deeper zones than the base set). Used by the split-screen
 * compare view's right pane. */
export function extremeScenarioFloodGeoJson(): FeatureCollection<Polygon> {
  return generateFloodPolygons(
    GOV_MAP_INITIAL_VIEW.latitude,
    GOV_MAP_INITIAL_VIEW.longitude,
    "critical",
    72,
  );
}
