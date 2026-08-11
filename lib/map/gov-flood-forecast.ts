// ---------------------------------------------------------------------
// lib/map/gov-flood-forecast.ts — Phase 8 · Step 5 · 72-hour flood
// forecast math behind the Gov Map TimeSliderControl.
//
// Pure, SSR-safe helpers. The slider drives `forecastHour` (0–72); these
// functions turn that hour into the flood geometry scale (the canvas
// simulates rising water by scaling the seeded flood polygons around
// their own centroids via @turf/transform-scale) and a status label.
// ---------------------------------------------------------------------

import { transformScale } from "@turf/transform-scale";
import type { FeatureCollection, Polygon } from "geojson";

/** Forecast horizon in hours. */
export const FORECAST_HOURS = 72;

/** Tick marks shown under the slider (every 12 hours). */
export const FORECAST_TICKS = [0, 12, 24, 36, 48, 60, 72] as const;

/** Clamp an hour into the valid 0–72 forecast window. */
export function clampForecastHour(hour: number): number {
  if (Number.isNaN(hour)) return 0;
  return Math.min(FORECAST_HOURS, Math.max(0, hour));
}

/** Flood polygon scale for an hour: 0.5× (t0) → 1.5× (t72) — water
 * spreads monotonically as the forecast advances. Linear interpolation. */
export function floodScaleForHour(hour: number): number {
  const h = clampForecastHour(hour);
  return 0.5 + (h / FORECAST_HOURS) * 1;
}

/** The flood outlook label for the slider's status chip. */
export type FloodStatus = "Steady" | "Rising" | "Peak";

export function floodStatusForHour(hour: number): FloodStatus {
  const h = clampForecastHour(hour);
  if (h < 24) return "Steady";
  if (h < 48) return "Rising";
  return "Peak";
}

/**
 * The flood polygon FeatureCollection scaled to the given forecast hour.
 * `transformScale` with the default `origin: "center"` scales each
 * polygon around its own centroid — a clean "water spreads" simulation.
 * The same factor also drives the fill intensity in the map (bigger water
 * = denser water). Hours ≤ 0 return the geometry untouched.
 */
export function scaleFloodForecast(
  geoJson: FeatureCollection<Polygon>,
  hour: number,
): FeatureCollection<Polygon> {
  const h = clampForecastHour(hour);
  if (h <= 0) return geoJson;
  return transformScale(geoJson, floodScaleForHour(h), { origin: "center" });
}
