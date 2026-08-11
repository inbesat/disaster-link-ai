// ---------------------------------------------------------------------
// lib/map/gov-map-export.ts — Phase 8 · Step 8 · Situation Report
// export metadata.
//
// Pure, SSR-safe helpers behind ExportMapButton. The button rasterises
// the MapLibre canvas, then draws this metadata onto the report:
//   • an auto-generated legend (visible layers → label + swatch colour)
//   • a Web-Mercator scale bar computed from the live zoom + latitude
//   • an IST-stamped "generated at" timestamp
// Everything here is plain data + math so it's unit-testable.
// ---------------------------------------------------------------------

import {
  GOV_LAYER_COLORS,
  GOV_LAYER_LABELS,
  GOV_MAP_LAYER_KEYS,
  type GovMapLayerKey,
} from "./gov-map-layers";

export type ExportLegendItem = { label: string; color: string };

/** Visible layers → legend entries, in catalog order (Flood Risk Zones
 * first, Crowdsourced Reports last). */
export function legendItemsForLayers(
  layers: Record<GovMapLayerKey, { visible: boolean }>,
): ExportLegendItem[] {
  return GOV_MAP_LAYER_KEYS.filter((key) => layers[key].visible).map((key) => ({
    label: GOV_LAYER_LABELS[key],
    color: GOV_LAYER_COLORS[key],
  }));
}

/** Web-Mercator metres-per-pixel at a zoom level + latitude (the scale
 * bar shrinks as you zoom out and as you move toward the poles). */
export function metersPerPixel(zoom: number, latitude: number): number {
  return (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
}

/** Format a scale-bar distance: "2.2 km" / "500 m" / "15 km". */
export function formatScaleDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export type ScaleBar = { widthPx: number; meters: number; label: string };

/** Ground-truth length covered by a `widthPx`-wide bar at the current
 * zoom + latitude, plus its human label. */
export function buildScaleBar(
  widthPx: number,
  zoom: number,
  latitude: number,
): ScaleBar {
  const meters = metersPerPixel(zoom, latitude) * widthPx;
  return { widthPx, meters, label: formatScaleDistance(meters) };
}

/** IST-stamped "generated at" line for the report header. The explicit
 * timeZone makes the output deterministic (and testable) anywhere. */
export function formatExportTimestamp(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
