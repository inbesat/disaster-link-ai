// ---------------------------------------------------------------------
// lib/map/tile-math.test.ts — Phase 8 · offline tile math
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  clampLatitude,
  latLngToTile,
  tileToLatLngBounds,
  tileNorthWest,
  getTileCoordinates,
  tileId,
  parseTileId,
  worldSizeAtZoom,
} from "./tile-math";

describe("clampLatitude", () => {
  it("clamps beyond the web-mercator limit", () => {
    expect(clampLatitude(90)).toBeCloseTo(85.05113, 3);
    expect(clampLatitude(-90)).toBeCloseTo(-85.05113, 3);
  });
  it("passes through valid latitudes", () => {
    expect(clampLatitude(25.6)).toBe(25.6);
  });
});

describe("latLngToTile", () => {
  it("maps the web-mercator origin (0,0) to the middle tile", () => {
    // zoom 1 splits the world into 2x2 tiles; (0 lng, 0 lat) is the
    // south-east corner of tile x=1, y=1 (bottom-right quadrant).
    expect(latLngToTile(0, 0, 1)).toEqual({ x: 1, y: 1, z: 1 });
  });
  it("maps a known city coordinate to the expected tile at z=11", () => {
    // Patna, India — at z=11 there are 2048 tiles per axis.
    const tile = latLngToTile(25.5941, 85.1376, 11);
    expect(tile.z).toBe(11);
    expect(tile.x).toBeGreaterThanOrEqual(1500);
    expect(tile.x).toBeLessThan(1520);
    expect(tile.y).toBeGreaterThanOrEqual(865);
    expect(tile.y).toBeLessThan(880);
  });
  it("rounds to whole tiles via Math.floor", () => {
    const tile = latLngToTile(0, 1, 2);
    expect(Number.isInteger(tile.x)).toBe(true);
    expect(Number.isInteger(tile.y)).toBe(true);
  });
});

describe("tileNorthWest / tileToLatLngBounds", () => {
  it("inverts latLngToTile for the tile covering (0,0) at z=1", () => {
    const tile = latLngToTile(0, 0, 1); // x=1, y=1
    expect(tile).toEqual({ x: 1, y: 1, z: 1 });
    const nw = tileNorthWest(1, 1, 1);
    // The north-west corner of the south-east tile is exactly (0,0).
    expect(nw.lng).toBeCloseTo(0, 6);
    expect(nw.lat).toBeCloseTo(0, 6);
  });
  it("returns a valid box for a z=0 tile (whole world)", () => {
    const box = tileToLatLngBounds(0, 0, 0);
    expect(box.west).toBeCloseTo(-180, 5);
    expect(box.east).toBeCloseTo(180, 5);
    expect(box.north).toBeGreaterThan(box.south);
  });
  it("produces 256px tiles: bounds span exactly 1/2^z of the world", () => {
    const box = tileToLatLngBounds(2, 1, 1);
    expect(box.east - box.west).toBeCloseTo(360 / 4, 5); // 90°
  });
});

describe("getTileCoordinates", () => {
  it("returns the 4 tiles covering a point region at z=1", () => {
    // A tiny box around (0,0) spans all four z=1 tiles.
    const tiles = getTileCoordinates(
      { north: 10, south: -10, east: 10, west: -10 },
      [1],
    );
    expect(tiles).toHaveLength(4);
  });
  it("dedupes and sorts zoom ascending across levels", () => {
    const tiles = getTileCoordinates(
      { north: 0.1, south: -0.1, east: 0.1, west: -0.1 },
      [2, 1, 2], // duplicate zoom, out of order
    );
    expect(tiles.length).toBe(4 + 4); // 4 at z=1 + 4 at z=2
    expect(tiles[0].z).toBe(1);
    expect(tiles[4].z).toBe(2);
    const keys = new Set(tiles.map((t) => tileId(t.z, t.x, t.y)));
    expect(keys.size).toBe(8);
  });
  it("covers the full world at zoom 0 with one tile", () => {
    const tiles = getTileCoordinates(
      { north: 85, south: -85, east: 180, west: -180 },
      [0],
    );
    expect(tiles).toEqual([{ z: 0, x: 0, y: 0 }]);
  });
  it("caps the result at maxTiles", () => {
    const tiles = getTileCoordinates(
      { north: 85, south: -85, east: 180, west: -180 },
      [10, 11, 12],
      50,
    );
    expect(tiles.length).toBeLessThanOrEqual(50);
  });
});

describe("tileId / parseTileId", () => {
  it("round-trips a tile id", () => {
    const id = tileId(11, 1682, 1160);
    expect(id).toBe("11/1682/1160");
    expect(parseTileId(id)).toEqual({ z: 11, x: 1682, y: 1160 });
  });
  it("returns null for malformed ids", () => {
    expect(parseTileId("11/1682")).toBeNull();
    expect(parseTileId("abc/def/ghi")).toBeNull();
    expect(parseTileId("-1/0/0")).toBeNull();
  });
});

describe("worldSizeAtZoom", () => {
  it("is 256 at z0 and doubles per zoom", () => {
    expect(worldSizeAtZoom(0)).toBe(256);
    expect(worldSizeAtZoom(1)).toBe(512);
    expect(worldSizeAtZoom(10)).toBe(256 * 1024);
  });
});
