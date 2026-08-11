// ---------------------------------------------------------------------
// lib/map/gov-measurements.ts — Phase 8 · Step 4 · Gov Map measurement
// math (Turf.js).
//
// Pure, SSR-safe helpers behind the MeasurementToolbar. The toolbar
// collects map clicks into a coordinate list; these functions turn that
// list into a distance (km, via @turf/length) or an area (sq km, via
// @turf/area), and format the result for the floating readout.
//
// Two deliberately simple rules:
//   • distance needs ≥ 2 points — otherwise 0
//   • area needs ≥ 3 points — the polygon is closed back to the first
//     point automatically
// ---------------------------------------------------------------------

import length from "@turf/length";
import area from "@turf/area";
import { lineString, polygon } from "@turf/helpers";

export type MeasureMode = "distance" | "area";

/** Great-circle length of a click-drawn path in km (0 below 2 points). */
export function measureDistanceKm(points: [number, number][]): number {
  if (points.length < 2) return 0;
  return length(lineString(points), { units: "kilometers" });
}

/** Area of a click-drawn polygon in sq km (0 below 3 points). The ring
 * is closed back to the first point so an open click-path still measures. */
export function measureAreaSqKm(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const ring = [...points, points[0]];
  return area(polygon([ring])) / 1_000_000;
}

/** Format a km value for the floating readout, e.g. "2.4 km". */
export function formatDistanceKm(km: number): string {
  if (km >= 100) return `${km.toFixed(0)} km`;
  if (km >= 10) return `${km.toFixed(1)} km`;
  return `${km.toFixed(2)} km`;
}

/** Format a sq-km value for the floating readout, e.g. "3.25 km²". */
export function formatAreaSqKm(sqKm: number): string {
  if (sqKm >= 100) return `${sqKm.toFixed(0)} km²`;
  if (sqKm >= 10) return `${sqKm.toFixed(1)} km²`;
  return `${sqKm.toFixed(2)} km²`;
}

/** The label the readout shows for a mode + points (pure, testable). */
export function measureLabel(
  mode: MeasureMode,
  points: [number, number][],
): string {
  if (mode === "distance") return formatDistanceKm(measureDistanceKm(points));
  return formatAreaSqKm(measureAreaSqKm(points));
}
