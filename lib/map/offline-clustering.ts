// ---------------------------------------------------------------------
// lib/map/offline-clustering.ts — Offline-First Architecture · Phase 8
// Offline marker clustering: groups cached alert / resource markers into
// "count" bubbles so a flooded district renders a handful of clusters
// instead of hundreds of DOM markers — fully offline, no supercluster
// dependency. Pure + injectable grid size, so tests assert exact clusters.
//
//   const clusters = clusterPoints(
//     [{ id, lat, lng }, ...],
//     { cellSizeDegrees: 0.05 },
//   );
//   // → [{ x, y, center: {lat,lng}, count, pointIds }]
// ---------------------------------------------------------------------

export interface ClusterablePoint {
  id: string;
  lat: number;
  lng: number;
}

export interface MarkerCluster {
  /** Grid cell key "x:y" (row index / column index in the grid). */
  key: string;
  /** Weighted centroid of every point in the cell. */
  center: { lat: number; lng: number };
  count: number;
  pointIds: string[];
}

export interface ClusterOptions {
  /** Grid cell size in degrees (≈ 0.05° ≈ ~5.5 km near the equator). */
  cellSizeDegrees?: number;
}

/** World-aligned grid size for the default 0.05° cell. */
export const DEFAULT_CELL_SIZE_DEGREES = 0.05;

/**
 * Groups points into a fixed world grid; points in the same cell become one
 * cluster centred on the weighted centroid of its members. A cell with one
 * point still returns a "cluster" of count 1 so callers can render pins and
 * bubbles uniformly.
 */
export function clusterPoints(
  points: ClusterablePoint[],
  options: ClusterOptions = {},
): MarkerCluster[] {
  const cell = options.cellSizeDegrees ?? DEFAULT_CELL_SIZE_DEGREES;
  const buckets = new Map<string, { lat: number; lng: number; ids: string[] }>();

  for (const point of points) {
    // Global grid: floor the coords to cell boundaries (handles negatives).
    const gx = Math.floor(point.lng / cell);
    const gy = Math.floor(point.lat / cell);
    const key = `${gx}:${gy}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.lat += point.lat;
      bucket.lng += point.lng;
      bucket.ids.push(point.id);
    } else {
      buckets.set(key, { lat: point.lat, lng: point.lng, ids: [point.id] });
    }
  }

  return Array.from(buckets.entries()).map(([key, bucket]) => {
    const count = bucket.ids.length;
    return {
      key,
      center: { lat: bucket.lat / count, lng: bucket.lng / count },
      count,
      pointIds: bucket.ids,
    };
  });
}

/**
 * Converts clusters into GeoJSON points for MapLibre, each carrying a
 * numeric `count` property so a circle/expression layer can size it.
 */
export function clustersToGeoJson(clusters: MarkerCluster[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: clusters.map((cluster) => ({
      type: "Feature",
      properties: { count: cluster.count },
      geometry: {
        type: "Point",
        coordinates: [cluster.center.lng, cluster.center.lat],
      },
    })),
  };
}

export default clusterPoints;
