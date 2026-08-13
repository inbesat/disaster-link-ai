// ---------------------------------------------------------------------
// lib/map/offline-nearest.test.ts — Phase 8 · GPS nearest-resource finder
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { rankCachedResources, toCachedResource, type CachedResource } from "./offline-nearest";

const ORIGIN = { lat: 25.61, lng: 85.11 }; // Patna

const R = (id: string, lat: number, lng: number): CachedResource => ({ id, lat, lng, name: id });

describe("rankCachedResources", () => {
  it("sorts resources closest-first with injected distance_km", () => {
    const resources = [
      R("far", 25.90, 85.50),
      R("near", 25.62, 85.12),
      R("mid", 25.70, 85.30),
    ];
    const ranked = rankCachedResources(resources, ORIGIN.lat, ORIGIN.lng);
    expect(ranked.map((r) => r.id)).toEqual(["near", "mid", "far"]);
    expect(ranked[0].distance_km).toBeLessThan(ranked[1].distance_km!);
    expect(ranked[1].distance_km).toBeLessThan(ranked[2].distance_km!);
    // distances are positive km values
    for (const r of ranked) expect(r.distance_km!).toBeGreaterThan(0);
  });

  it("respects the limit", () => {
    const resources = Array.from({ length: 10 }, (_, i) => R(`r${i}`, 25.61 + i * 0.01, 85.11 + i * 0.01));
    const ranked = rankCachedResources(resources, ORIGIN.lat, ORIGIN.lng, 3);
    expect(ranked).toHaveLength(3);
    expect(ranked[0].id).toBe("r0");
  });

  it("handles empty input", () => {
    expect(rankCachedResources([], ORIGIN.lat, ORIGIN.lng)).toEqual([]);
  });

  it("is pure — does not mutate the input", () => {
    const resources = [R("a", 25.9, 85.5), R("b", 25.62, 85.12)];
    const snapshot = resources.map((r) => ({ ...r }));
    rankCachedResources(resources, ORIGIN.lat, ORIGIN.lng);
    expect(resources).toEqual(snapshot); // no distance_km injected in place
  });
});

describe("toCachedResource", () => {
  it("parses an OfflineRecord data payload with lat/lng", () => {
    const row = toCachedResource({ id: "s-1", name: "Shelter A", lat: 25.6, lng: 85.1, type: "shelter" });
    expect(row).toMatchObject({ id: "s-1", name: "Shelter A", lat: 25.6, lng: 85.1, type: "shelter" });
  });

  it("accepts latitude/longitude aliases", () => {
    const row = toCachedResource({ id: "r-2", latitude: 1, longitude: 2 });
    expect(row).toMatchObject({ id: "r-2", lat: 1, lng: 2 });
  });

  it("returns null for malformed payloads", () => {
    expect(toCachedResource(null)).toBeNull();
    expect(toCachedResource("nope")).toBeNull();
    expect(toCachedResource({ id: "x" })).toBeNull(); // no coords
    expect(toCachedResource({ lat: "abc", lng: 1 })).toBeNull();
  });
});
