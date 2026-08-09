"use client";

// ---------------------------------------------------------------------
// components/dashboard/LiveMapCanvas.tsx — UI/UX Phase 4 · Step 4.
//
// The actual MapLibre render inside LiveMapWidget. Loaded client-only via
// next/dynamic (SSR:false) because maplibre-gl touches `window`. Static,
// non-interactive view centred on Patna with a translucent red flood-zone
// polygon + a few shelter markers.
// ---------------------------------------------------------------------

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map, Source, Layer, Marker } from "react-map-gl/maplibre";
import type { Feature, Polygon } from "geojson";
import { Home } from "lucide-react";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Patna district centre (district-admin default). */
const CENTER = { lng: 85.1376, lat: 25.59 } as const;

/** Mock flood zone — a wide band hugging the Ganga flood-plain north of Patna. */
const FLOOD_ZONE: Feature<Polygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [85.0, 25.56],
        [85.1, 25.7],
        [85.24, 25.715],
        [85.36, 25.62],
        [85.26, 25.53],
        [85.12, 25.52],
        [85.0, 25.56],
      ],
    ],
  },
};

const SHELTER_SPOTS: Array<{ lng: number; lat: number }> = [
  { lng: 85.09, lat: 25.63 },
  { lng: 85.21, lat: 25.61 },
  { lng: 85.29, lat: 25.68 },
];

export function LiveMapCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-b-lg">
      <Map
        mapLib={maplibregl}
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: CENTER.lng, latitude: CENTER.lat, zoom: 11.2 }}
        style={{ width: "100%", height: "100%" }}
        interactive={false}
        attributionControl={false}
      >
        <Source id="flood-zone" type="geojson" data={FLOOD_ZONE}>
          <Layer
            id="flood-fill"
            type="fill"
            paint={{
              "fill-color": "#ef4444",
              "fill-opacity": 0.28,
            }}
          />
          <Layer
            id="flood-outline"
            type="line"
            paint={{
              "line-color": "#ef4444",
              "line-width": 2,
              "line-opacity": 0.7,
            }}
          />
        </Source>

        {SHELTER_SPOTS.map((spot, i) => (
          <Marker key={i} longitude={spot.lng} latitude={spot.lat} anchor="center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300 bg-emerald-500/90 text-slate-950 shadow-lg shadow-black/40">
              <Home className="h-3.5 w-3.5" aria-hidden />
            </span>
          </Marker>
        ))}
      </Map>
    </div>
  );
}

export default LiveMapCanvas;
