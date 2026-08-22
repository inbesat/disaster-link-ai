"use client";

// ---------------------------------------------------------------------
// components/dashboard/WorldMapCanvas.tsx
//
// Interactive MapLibre world view for the Global Command Center section.
// Centred on the Europe / North-Africa / South-Asia corridor at a low zoom
// to show the full operational theatre. Layers are toggled via the parent
// GlobalWorldMap controls.
// ---------------------------------------------------------------------

import { useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map, Source, Layer, Marker } from "react-map-gl/maplibre";
import type { FeatureCollection, Polygon, Point } from "geojson";
import {
  AlertTriangle,
  Home,
  Package,
} from "lucide-react";

// ── Carto dark-matter base ──────────────────────────────────────────
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Default view — Europe / North-Africa / Middle-East / South-Asia. */
const INITIAL_VIEW = {
  longitude: 48,
  latitude: 28,
  zoom: 3,
} as const;

// ── Mock flood risk zones (global) ──────────────────────────────────
const FLOOD_RISK_GEOJSON: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    // South Asia — Ganga / Brahmaputra basin
    {
      type: "Feature",
      properties: { name: "Ganga Basin", severity: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74, 22],
            [88, 21],
            [92, 27],
            [85, 30],
            [76, 29],
            [74, 22],
          ],
        ],
      },
    },
    // West Africa — Niger delta
    {
      type: "Feature",
      properties: { name: "Niger Delta", severity: "medium" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 4],
            [10, 4],
            [14, 13],
            [4, 13],
            [0, 4],
          ],
        ],
      },
    },
    // Europe — Danube corridor
    {
      type: "Feature",
      properties: { name: "Danube Corridor", severity: "low" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [14, 44],
            [30, 44],
            [30, 49],
            [14, 49],
            [14, 44],
          ],
        ],
      },
    },
    // North Africa — Nile delta
    {
      type: "Feature",
      properties: { name: "Nile Delta", severity: "medium" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [29, 29],
            [34, 29],
            [35, 32],
            [30, 32],
            [29, 29],
          ],
        ],
      },
    },
  ],
};

// ── Global shelter markers ──────────────────────────────────────────
const GLOBAL_SHELTERS: Array<{ lng: number; lat: number; name: string }> = [
  { lng: 85.2, lat: 25.6, name: "Patna Central" },
  { lng: 90.4, lat: 23.8, name: "Dhaka Relief" },
  { lng: 72.9, lat: 19.1, name: "Mumbai Coastal" },
  { lng: 3.4, lat: 6.5, name: "Lagos Delta" },
  { lng: 16.4, lat: 48.2, name: "Vienna Shelter" },
  { lng: 31.2, lat: 30.0, name: "Cairo Nile" },
  { lng: 100.5, lat: 13.8, name: "Bangkok Basin" },
  { lng: 106.8, lat: -6.2, name: "Jakarta Lowlands" },
];

// ── Global resource depots ──────────────────────────────────────────
const GLOBAL_RESOURCES: Array<{ lng: number; lat: number; name: string }> = [
  { lng: 77.2, lat: 28.6, name: "Delhi Hub" },
  { lng: 37.6, lat: 55.8, name: "Moscow Stockpile" },
  { lng: -0.1, lat: 51.5, name: "London Reserve" },
  { lng: 139.7, lat: 35.7, name: "Tokyo Depot" },
];

// ── Layer colour helpers ────────────────────────────────────────────
function severityColor(severity?: string): string {
  switch (severity) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    default:
      return "#3b82f6";
  }
}

// ── Types ───────────────────────────────────────────────────────────
interface WorldMapCanvasProps {
  activeLayers: Record<string, boolean>;
  hazardType: string;
}

// ── Component ───────────────────────────────────────────────────────
export function WorldMapCanvas({ activeLayers }: WorldMapCanvasProps) {
  /** Per-feature fill colours based on severity. */
  const floodFillPaint = useMemo(
    () => ({
      "fill-color": [
        "match",
        ["get", "severity"],
        "high",
        "#ef4444",
        "medium",
        "#f59e0b",
        "low",
        "#3b82f6",
        "#3b82f6",
      ] as unknown as string,
      "fill-opacity": 0.22,
    }),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden rounded-b-lg">
      <Map
        mapLib={maplibregl}
        mapStyle={MAP_STYLE}
        initialViewState={INITIAL_VIEW}
        style={{ width: "100%", height: "100%", minHeight: "400px" }}
        attributionControl={false}
      >
        {/* ── Flood risk zones ──────────────────────────────────────── */}
        {activeLayers["flood-risk"] && (
          <Source id="global-flood-risk" type="geojson" data={FLOOD_RISK_GEOJSON}>
            <Layer
              id="global-flood-fill"
              type="fill"
              paint={floodFillPaint}
            />
            <Layer
              id="global-flood-outline"
              type="line"
              paint={{
                "line-color": "#f59e0b",
                "line-width": 1.5,
                "line-opacity": 0.6,
              }}
            />
          </Source>
        )}

        {/* ── Shelter markers ───────────────────────────────────────── */}
        {activeLayers["shelters"] &&
          GLOBAL_SHELTERS.map((s, i) => (
            <Marker
              key={`shelter-${i}`}
              longitude={s.lng}
              latitude={s.lat}
              anchor="center"
            >
              <span
                className="group relative flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300 bg-emerald-500/90 text-slate-950 shadow-lg shadow-black/40 transition hover:scale-125"
                title={s.name}
              >
                <Home className="h-3 w-3" aria-hidden />
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {s.name}
                </span>
              </span>
            </Marker>
          ))}

        {/* ── Resource depots ───────────────────────────────────────── */}
        {activeLayers["resources"] &&
          GLOBAL_RESOURCES.map((r, i) => (
            <Marker
              key={`resource-${i}`}
              longitude={r.lng}
              latitude={r.lat}
              anchor="center"
            >
              <span
                className="group relative flex h-6 w-6 items-center justify-center rounded-full border border-purple-300 bg-purple-500/90 text-slate-950 shadow-lg shadow-black/40 transition hover:scale-125"
                title={r.name}
              >
                <Package className="h-3 w-3" aria-hidden />
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {r.name}
                </span>
              </span>
            </Marker>
          ))}
      </Map>

      {/* ── Legend overlay ──────────────────────────────────────────── */}
      {activeLayers["flood-risk"] && (
        <div className="absolute bottom-3 left-3 rounded-lg border border-white/10 bg-[#0a0f1a]/90 px-3 py-2 backdrop-blur-sm">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Risk Level
          </p>
          <div className="flex flex-col gap-1">
            {[
              { label: "High", color: "#ef4444" },
              { label: "Medium", color: "#f59e0b" },
              { label: "Low", color: "#3b82f6" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[9px] text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Hazard badge ───────────────────────────────────────────── */}
      <div className="absolute right-3 top-3 rounded-lg border border-white/10 bg-[#0a0f1a]/90 px-3 py-1.5 backdrop-blur-sm">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          <AlertTriangle className="h-3 w-3" aria-hidden />
          Flood Active
        </span>
      </div>
    </div>
  );
}

export default WorldMapCanvas;
