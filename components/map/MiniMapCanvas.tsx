"use client";

// ---------------------------------------------------------------------
// components/map/MiniMapCanvas.tsx — UI/UX Phase 5 · Step 8.
//
// Static MapLibre base layer for the Picture-in-Picture mini-map. A wider,
// lower-zoom view of the Patna theatre than the main map so the red
// "current viewport" rectangle has room to travel. Client-only via
// next/dynamic (maplibre-gl touches `window`).
// ---------------------------------------------------------------------

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map } from "react-map-gl/maplibre";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function MiniMapCanvas() {
  return (
    <div className="absolute inset-0">
      <Map
        mapLib={maplibregl}
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: 85.1376, latitude: 25.59, zoom: 8.6 }}
        style={{ width: "100%", height: "100%" }}
        interactive={false}
        attributionControl={false}
      />
    </div>
  );
}

export default MiniMapCanvas;
