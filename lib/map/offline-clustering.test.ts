// ---------------------------------------------------------------------
// lib/map/offline-clustering.test.ts — Phase 8 · offline clustering
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  clusterPoints,
  clustersToGeoJson,
  DEFAULT_CELL_SIZE_DEGREES,
  type ClusterablePoint,
} from "./offline-clustering";

const POINT = (id: string, lat: number, lng: number): ClusterablePoint => ({ id, lat, lng });

describe("clusterPoints", () => {
  it("clusters points in the same cell into one bubble", () => {
    const points = [
      POINT("a", 25.61, 85.11),
      POINT("b", 25.62, 85.12),
      POINT("c", 25.63, 85.13),
    ];
    const clusters = clusterPoints(points, { cellSizeDegrees: 0.1 });
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(3);
    expect(clusters[0].pointIds.sort()).toEqual(["a", "b", "c"]);
  });

  it("keeps distant points in separate cells", () => {
    const points = [
      POINT("patna", 25.6, 85.1),
      POINT("delhi", 28.6, 77.2),
    ];
    const clusters = clusterPoints(points);
    expect(clusters).toHaveLength(2);
  });

  it("centres the cluster on the weighted centroid", () => {
    const points = [
      POINT("a", 25.60, 85.10),
      POINT("b", 25.62, 85.14),
    ];
    const [cluster] = clusterPoints(points, { cellSizeDegrees: 1 });
    expect(cluster.center.lat).toBeCloseTo(25.61, 5);
    expect(cluster.center.lng).toBeCloseTo(85.12, 5);
  });

  it("handles negative coordinates (western/southern hemisphere)", () => {
    const points = [POINT("s", -23.55, -46.63), POINT("p", -23.56, -46.65)];
    const clusters = clusterPoints(points, { cellSizeDegrees: 0.1 });
    // Both in the same floor() cell — single cluster.
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(2);
  });

  it("returns one cluster per point when cells are tiny", () => {
    const points = [POINT("a", 25.6, 85.1), POINT("b", 25.6001, 85.1001)];
    const clusters = clusterPoints(points, { cellSizeDegrees: 0.00001 });
    expect(clusters).toHaveLength(2);
  });
});

describe("clustersToGeoJson", () => {
  it("exports a GeoJSON FeatureCollection with count props", () => {
    const clusters = clusterPoints(
      [POINT("a", 25.61, 85.11), POINT("b", 25.62, 85.12)],
      { cellSizeDegrees: 0.1 },
    );
    const geojson = clustersToGeoJson(clusters);
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(1);
    expect(geojson.features[0].properties?.count).toBe(2);
    expect(geojson.features[0].geometry.type).toBe("Point");
    expect((geojson.features[0].geometry as { coordinates: number[] }).coordinates).toEqual([
      expect.any(Number),
      expect.any(Number),
    ]);
  });
});

describe("DEFAULT_CELL_SIZE_DEGREES", () => {
  it("is ~5.5 km near the equator (0.05°)", () => {
    expect(DEFAULT_CELL_SIZE_DEGREES).toBe(0.05);
  });
});
