"use client";

// ---------------------------------------------------------------------
// lib/map/offline-protocol.ts — Offline-First Architecture · Phase 8
// MapLibre `addProtocol` loader that serves raster tiles from IndexedDB
// first and only touches the network when the tile isn't cached. Tiles
// fetched online are stored for the next time the connection drops.
//
// Register once per session:
//
//   import maplibregl from "maplibre-gl";
//   import { registerOfflineTileProtocol } from "./offline-protocol";
//   registerOfflineTileProtocol(maplibregl);
//
// Then use a raster source with `tiles: ["offline://{z}/{x}/{y}"]` — the
// loader intercepts the custom scheme before MapLibre ever fires a network
// request, so the map renders fully from cached data while offline.
//
// MapLibre's addProtocol contract:
//   (params: { url, type, signal }) => Promise<{ data: ArrayBuffer }>
// ---------------------------------------------------------------------

import maplibregl, { type AddProtocolAction } from "maplibre-gl";
import OfflineMapManager from "./offline-map-manager";
import { parseTileId } from "./tile-math";

/** Custom scheme the offline raster source requests. */
export const OFFLINE_TILE_SCHEME = "offline";

let registered = false;

/**
 * Registers the offline tile protocol on a MapLibre instance. Idempotent —
 * calling more than once is a no-op. Returns the manager used by the loader
 * so the same instance can drive "cache this region" in the UI.
 */
export function registerOfflineTileProtocol(manager?: OfflineMapManager): OfflineMapManager {
  const m = manager ?? new OfflineMapManager();
  if (registered) return m;
  try {
    const loader: AddProtocolAction = async (params) => {
      const parsed = parseTileId(decodeURIComponent(params.url.replace("offline://", "")));
      if (!parsed) {
        throw new Error(`offline-protocol: bad tile url ${params.url}`);
      }
      const blob = await m.getTile(parsed.z, parsed.x, parsed.y);
      if (blob) {
        return { data: await blob.arrayBuffer(), cacheControl: "max-age=604800" };
      }
      // Cold tile while online: fetch + store for next time.
      const bytes = await m.fetchTileFallback(parsed.z, parsed.x, parsed.y);
      return { data: bytes, cacheControl: "max-age=604800" };
    };
    maplibregl.addProtocol(OFFLINE_TILE_SCHEME, loader);
    registered = true;
  } catch {
    // addProtocol unsupported (older build) — map falls back to network.
  }
  return m;
}

export default registerOfflineTileProtocol;
