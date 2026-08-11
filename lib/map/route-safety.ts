// ---------------------------------------------------------------------
// lib/map/route-safety.ts — Phase 1 · Step 9 · Route Safety Score.
//
// Residents don't read hazard tables — they want to know "is my way there
// still safe?". This module takes the same mock evacuation polyline the
// map already draws and grades it segment-by-segment across four hazard
// levels:
//
//   safe    (green)   — clear of every danger.
//   watch   (amber)   — no flood underfoot, but danger within ~1.5 km. Be
//                       alert.
//   flooded (red)     — inside a flood polygon. Don't linger.
//   closed  (black)   — within ~150 m of an active road closure. Blocked.
//
// The overall "Route Safety Score" (0–100, % of safe segments) is what the
// RouteSafetyOverlay badge shows, and `mockRerouteAvailable` drives the
// demo's "a safer route is now available" push notification.
//
// Pure + SSR-safe: everything is seeded/derived from the endpoint coords,
// the binary citizen flood zones and the mock road closures — geometry
// never hits the network, so the grade is instant and stable per route.
// ---------------------------------------------------------------------

import { booleanPointInPolygon } from "@turf/turf";
import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import type { RoadClosureLike } from "./road-closures-client";
import { buildCitizenEvacuationRoute } from "./citizen-evacuation-route";

/** The four hazard levels a route segment can carry. */
export const ROUTE_HAZARDS = ["safe", "watch", "flooded", "closed"] as const;

export type RouteHazard = (typeof ROUTE_HAZARDS)[number];

/** Segment → color, shared by the map layers and the overlay legend. */
export const ROUTE_HAZARD_COLORS: Record<RouteHazard, string> = {
  safe: "#34d399",
  watch: "#facc15",
  flooded: "#ef4444",
  closed: "#111827",
};

/** Resample target — the mock path is split into this many graded segments. */
export const ROUTE_SEGMENT_COUNT = 12;

/** A segment whose midpoint is within 150 m of an active closure is blocked. */
export const CLOSURE_PROXIMITY_METERS = 150;

/** A segment within 1.5 km of danger (but not inside it) reads as "watch". */
export const WATCH_PROXIMITY_METERS = 1500;

export type RouteSafetySegment = Feature<LineString, { hazard: RouteHazard }>;

export type RouteSafetyClassification = {
  /** Number of graded segments (== segmentCount passed in). */
  segmentCount: number;
  /** Overall safety score 0–100 — the % of segments graded "safe". */
  score: number;
  /** How many segments sit directly inside a flood polygon. */
  floodHazards: number;
  /** How many segments are blocked by an active road closure. */
  closedHazards: number;
  /** How many segments are merely near danger (amber). */
  watchHazards: number;
  /** One hazard per segment — direct feed for the map layers. */
  hazards: RouteHazard[];
  /** Per-segment geo lines with their hazard baked into props. */
  features: RouteSafetySegment[];
};

/**
 * Great-circle distance (haversine) in metres. Pure, dependency-free so
 * both route grading here and Step 10's offline cache can share it.
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const lat1r = (lat1 * Math.PI) / 180;
  const lat2r = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Re-sample a polyline into `targetSegments` equal-length segments while
 * preserving the original endpoints. Returns `targetSegments + 1` points.
 * Stable (linear interpolation along cumulative distance) so grading
 * doesn't depend on how many wiggle points the mock route happened to use.
 */
export function resamplePolyline(
  coords: [number, number][],
  targetSegments: number,
): [number, number][] {
  const lengths: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    lengths.push(lengths[i - 1] + haversineDistanceMeters(lat1, lng1, lat2, lng2));
  }
  const total = lengths[lengths.length - 1];
  if (total <= 0 || targetSegments <= 0) return [coords[0], coords[coords.length - 1]];

  const out: [number, number][] = [];
  let j = 1;
  for (let k = 0; k <= targetSegments; k++) {
    const target = (total * k) / targetSegments;
    while (j < lengths.length - 1 && lengths[j] < target) j++;
    const segLen = lengths[j] - lengths[j - 1] || 1;
    const t = Math.min(Math.max((target - lengths[j - 1]) / segLen, 0), 1);
    const [lng1, lat1] = coords[j - 1];
    const [lng2, lat2] = coords[j];
    out.push([lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t]);
  }
  return out;
}

/** Min distance (m) from a point to a polygon ring — a vertex lower bound. */
function distanceToDanger(ring: [number, number][], pointLng: number, pointLat: number): number {
  let min = Infinity;
  for (const [lng, lat] of ring) {
    const d = haversineDistanceMeters(pointLat, pointLng, lat, lng);
    if (d < min) min = d;
  }
  return min;
}

/**
 * Grade the mock citizen evacuation route end-to-end.
 *
 * The path is re-sampled into `segmentCount` equal pieces; each midpoint is
 * classified (in precedence order): blocked by an active closure → flooded
 * (point-in-polygon against the binary zones) → near danger (watch) → safe.
 * `zones` and `closures` may both be empty — a clear route grades 100.
 */
export function classifyCitizenRoute(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number,
  zones: FeatureCollection<Polygon>,
  closures: RoadClosureLike[] = [],
  segmentCount = ROUTE_SEGMENT_COUNT,
): RouteSafetyClassification {
  const base = buildCitizenEvacuationRoute(
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    zones,
  );

  // Flatten the per-segment features back into one walkable polyline.
  const waypoints: [number, number][] = [];
  for (const feature of base.features) {
    for (const coord of feature.geometry.coordinates) {
      waypoints.push(coord as [number, number]);
    }
  }
  // De-dupe shared joints (every segment shares its neighbour's vertex).
  const poly: [number, number][] = [];
  for (const coord of waypoints) {
    const last = poly[poly.length - 1];
    if (!last || last[0] !== coord[0] || last[1] !== coord[1]) poly.push(coord);
  }

  const points = resamplePolyline(poly, segmentCount);
  const hazards: RouteHazard[] = [];
  const features: RouteSafetySegment[] = [];

  const activeClosures = closures.filter((c) => c.isActive || c.isActive === undefined);
  // Cache the danger-ring lon/lats so we never re-flatten polygons per segment.
  const rings = zones.features.map(
    (zone) => zone.geometry.coordinates[0] as [number, number][],
  );

  for (let i = 0; i < points.length - 1; i++) {
    const [lng1, lat1] = points[i];
    const [lng2, lat2] = points[i + 1];
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;

    let hazard: RouteHazard = "safe";

    // 1. Blocked by an active road closure.
    const blocked = activeClosures.some(
      (c) => haversineDistanceMeters(midLat, midLng, c.lat, c.lng) <= CLOSURE_PROXIMITY_METERS,
    );

    // 2. Inside a binary flood polygon.
    const flooded =
      !blocked &&
      zones.features.some((zone) => booleanPointInPolygon([midLng, midLat], zone));

    // 3. Near (≤ 1.5 km) danger but not inside it.
    let near = false;
    if (!blocked && !flooded) {
      for (const ring of rings) {
        const d = distanceToDanger(ring, midLng, midLat);
        if (d <= WATCH_PROXIMITY_METERS) {
          near = true;
          break;
        }
      }
    }

    if (blocked) hazard = "closed";
    else if (flooded) hazard = "flooded";
    else if (near) hazard = "watch";

    hazards.push(hazard);
    features.push({
      type: "Feature",
      properties: { hazard },
      geometry: {
        type: "LineString",
        coordinates: [
          [lng1, lat1],
          [lng2, lat2],
        ],
      },
    });
  }

  const floodHazards = hazards.filter((h) => h === "flooded").length;
  const closedHazards = hazards.filter((h) => h === "closed").length;
  const watchHazards = hazards.filter((h) => h === "watch").length;
  const safe = segmentCount - floodHazards - closedHazards - watchHazards;

  return {
    segmentCount,
    score: Math.round((100 * safe) / segmentCount),
    floodHazards,
    closedHazards,
    watchHazards,
    hazards,
    features,
  };
}

/**
 * Demo driver for the "a safer route is now available" push notification.
 * Returns true whenever the current path has any blocked/flooded segment —
 * i.e. rerouting could genuinely improve things.
 */
export function mockRerouteAvailable(classification: RouteSafetyClassification): boolean {
  return classification.floodHazards > 0 || classification.closedHazards > 0;
}