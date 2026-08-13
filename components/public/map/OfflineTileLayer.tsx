"use client";

// ---------------------------------------------------------------------
// components/public/map/OfflineTileLayer.tsx — Phase 8 · Offline Maps
// Registers the MapLibre "offline://" protocol so a raster source renders
// straight from IndexedDB-cached tiles. When a tile is cold it's fetched
// over the network and cached for the next offline session (see
// lib/map/offline-protocol.ts).
//
// Usage inside <Map> from react-map-gl/maplibre:
//
//   <OfflineTileLayer
//     beforeId="..."                 // draw under labels / above basemap
//     manager={manager}              // reuse the cache-region instance
//   />
//
// The layer is a raster source with a fixed tile size; because MapLibre
// only has one raster source per map this component replaces the basemap
// when rendered — offline-capable tiles for the whole visible viewport.
// ---------------------------------------------------------------------

import { useEffect } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { registerOfflineTileProtocol } from "@/lib/map/offline-protocol";
import type OfflineMapManager from "@/lib/map/offline-map-manager";

type OfflineTileLayerProps = {
  /** Reuse a manager so the same instance drives "cache region" + display. */
  manager?: OfflineMapManager;
  /** Insert the layer before this existing layer id (draw order). */
  beforeId?: string;
  /** MapLibre raster paint overrides. */
  paint?: Record<string, unknown>;
};

export default function OfflineTileLayer({ manager, beforeId, paint }: OfflineTileLayerProps) {
  // Register once per session — the protocol persists across components.
  useEffect(() => {
    registerOfflineTileProtocol(manager);
  }, [manager]);

  return (
    <Source
      id="offline-raster"
      type="raster"
      tiles={["offline://{z}/{x}/{y}"]}
      tileSize={256}
      maxzoom={18}
    >
      <Layer
        id="offline-raster-layer"
        type="raster"
        beforeId={beforeId}
        paint={{
          "raster-opacity": 1,
          "raster-fade-duration": 0,
          ...paint,
        }}
      />
    </Source>
  );
}
