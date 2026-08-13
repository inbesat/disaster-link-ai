// ---------------------------------------------------------------------
// lib/map/tile-math.ts — Offline-First Architecture · Phase 8
// Pure slippy-map (Web Mercator) tile math shared by OfflineMapManager,
// the offline tile protocol and the "cache this region" UI.
//
//   • latLngToTile / tileToLatLngBounds — conversions used to decide which
//     tiles a map viewport needs.
//   • getTileCoordinates(bounds, zoomLevels) — the full tile set to fetch
//     for a region (deduplicated, capped).
//   • tileId(z, x, y) — the natural key stored in db.mapTiles ("z/x/y").
//
// All functions are pure so the map can compute tiles deterministically in
// tests without touching the DOM or network.
// ---------------------------------------------------------------------

/** Number of world pixels on each axis at zoom z: 256 * 2^z. */
export function worldSizeAtZoom(zoom: number): number {
  return 256 * 2 ** zoom;
}

/** Number of tiles on each axis at zoom z: 2^z. */
export function tileCountAtZoom(zoom: number): number {
  return 2 ** zoom;
}

/** Clamps a latitude into the Web-Mercator valid range (±85.05113°). */
export function clampLatitude(lat: number): number {
  return Math.max(-85.05113, Math.min(85.05113, lat));
}

/** Converts (lat, lng) to the tile x/y at zoom z. Returns whole tiles. */
export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number; z: number } {
  const latRad = (clampLatitude(lat) * Math.PI) / 180;
  const count = tileCountAtZoom(zoom);
  const x = Math.min(
    count - 1,
    Math.max(0, Math.floor(((lng + 180) / 360) * count)),
  );
  const y = Math.min(
    count - 1,
    Math.max(0, Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * count)),
  );
  return { x, y, z: Math.floor(zoom) };
}

/** The north-west corner (lat, lng) covered by tile (z, x, y). */
export function tileNorthWest(z: number, x: number, y: number): { lat: number; lng: number } {
  const count = tileCountAtZoom(z);
  const lng = (x / count) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / count;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

/** The lat/lng bounding box covered by tile (z, x, y). */
export function tileToLatLngBounds(
  z: number,
  x: number,
  y: number,
): { west: number; south: number; east: number; north: number } {
  const nw = tileNorthWest(z, x, y);
  const se = tileNorthWest(z, x + 1, y + 1);
  return { west: nw.lng, north: nw.lat, east: se.lng, south: se.lat };
}

export interface LatLngBoundsLike {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * The full, deduplicated set of tiles that cover a region at every requested
 * zoom. Order is deterministic (zoom ascending) so the manager can cache a
 * zoom-in sequence naturally. Capped to guard a giant bounds × many zooms.
 */
export function getTileCoordinates(
  bounds: LatLngBoundsLike,
  zoomLevels: number[],
  maxTiles = 5000,
): Array<{ z: number; x: number; y: number }> {
  const result: Array<{ z: number; x: number; y: number }> = [];
  const seen = new Set<string>();
  const zooms = Array.from(new Set(zoomLevels.map((z) => Math.floor(z)))).sort((a, b) => a - b);

  for (const zoom of zooms) {
    const northWest = latLngToTile(bounds.north, bounds.west, zoom);
    const southEast = latLngToTile(bounds.south, bounds.east, zoom);
    const xMin = Math.min(northWest.x, southEast.x);
    const xMax = Math.max(northWest.x, southEast.x);
    const yMin = Math.min(northWest.y, southEast.y);
    const yMax = Math.max(northWest.y, southEast.y);

    for (let x = xMin; x <= xMax && result.length < maxTiles; x += 1) {
      for (let y = yMin; y <= yMax && result.length < maxTiles; y += 1) {
        const id = `${zoom}/${x}/${y}`;
        if (seen.has(id)) continue;
        seen.add(id);
        result.push({ z: zoom, x, y });
      }
    }
  }
  return result;
}

/** Natural key for db.mapTiles — "z/x/y". */
export function tileId(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

/** Parses a "z/x/y" tile id back into its parts (null when malformed). */
export function parseTileId(id: string): { z: number; x: number; y: number } | null {
  const [z, x, y] = id.split("/").map(Number);
  if (![z, x, y].every(Number.isFinite) || z < 0 || x < 0 || y < 0) return null;
  return { z, x, y };
}

export default getTileCoordinates;
