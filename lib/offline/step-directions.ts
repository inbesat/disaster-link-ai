// ---------------------------------------------------------------------
// lib/offline/step-directions.ts — Phase 1 · Step 10 · Offline turn-by-
// turn text.
//
// Google Maps can't help you with no signal. So this module turns the
// cached mock route polyline into plain-language walking steps:
// "Head north-east for 1.2 km", "Head east for 800 m", … "You have
// arrived". Nothing online, nothing to fetch — the directions are computed
// straight from the geometry with the same pure helpers the map uses
// (haversine + re-sampling).
//
// SSR-safe: pure functions only.
// ---------------------------------------------------------------------

import { haversineDistanceMeters, resamplePolyline } from "@/lib/map/route-safety";
import type { FeatureCollection, LineString } from "geojson";

export type OfflineStep = {
  /** Cardinal instruction, e.g. "Head north-east for 1.2 km". */
  instruction: string;
  /** Bearing label, e.g. "NE". */
  bearingLabel: string;
  /** Length of this step in metres (0 for the arrival step). */
  distanceMeters: number;
};

/** Rough 8-point compass label for a bearing in degrees. */
export function bearingName(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][index];
}

/** Meters → readable "1.2 km" / "800 m" string. */
export function formatMetres(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1).replace(/\.0$/, "")} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Flatten a mock route FeatureCollection into one [lng, lat] polyline
 * (the segments share joint vertices, so they are de-duplicated).
 */
export function flattenRoute(
  route: FeatureCollection<LineString, { flooded: boolean }>,
): [number, number][] {
  const waypoints: [number, number][] = [];
  for (const feature of route.features) {
    for (const coord of feature.geometry.coordinates) {
      waypoints.push(coord as [number, number]);
    }
  }
  const poly: [number, number][] = [];
  for (const coord of waypoints) {
    const last = poly[poly.length - 1];
    if (!last || last[0] !== coord[0] || last[1] !== coord[1]) poly.push(coord);
  }
  return poly;
}

/**
 * Build `stepCount` evenly spaced walking steps along a polyline plus a
 * closing "You have arrived" step. Distances are great-circle metres.
 */
export function buildStepDirections(
  coords: [number, number][],
  stepCount = 4,
): OfflineStep[] {
  if (coords.length < 2) return [];
  const points = resamplePolyline(coords, stepCount);

  const steps: OfflineStep[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [lng1, lat1] = points[i];
    const [lng2, lat2] = points[i + 1];
    const distanceMeters = haversineDistanceMeters(lat1, lng1, lat2, lng2);
    const bearingDeg = (Math.atan2(lng2 - lng1, lat2 - lat1) * 180) / Math.PI;
    const label = bearingName(bearingDeg);
    steps.push({
      instruction: `Head ${label.toLowerCase()} for ${formatMetres(distanceMeters)}`,
      bearingLabel: label,
      distanceMeters,
    });
  }

  steps.push({
    instruction: "You have arrived at your destination",
    bearingLabel: "✓",
    distanceMeters: 0,
  });
  return steps;
}