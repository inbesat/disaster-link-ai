import { describe, expect, it } from "vitest";
import { generateCitizenFloodZones } from "./citizen-flood-zones";
import { buildCitizenEvacuationRoute } from "./citizen-evacuation-route";

const PATNA = { lat: 25.5941, lng: 85.1376 };
const ZONES = generateCitizenFloodZones(PATNA.lat, PATNA.lng);

describe("buildCitizenEvacuationRoute", () => {
  it("connects the origin to the destination", () => {
    const route = buildCitizenEvacuationRoute(
      PATNA.lat,
      PATNA.lng,
      25.609,
      85.164,
      ZONES,
    );
    expect(route.features.length).toBeGreaterThanOrEqual(3);

    const first = route.features[0].geometry.coordinates[0];
    const last = route.features[route.features.length - 1].geometry.coordinates[1];
    expect(first[0]).toBeCloseTo(PATNA.lng, 4);
    expect(first[1]).toBeCloseTo(PATNA.lat, 4);
    expect(last[0]).toBeCloseTo(85.164, 4);
    expect(last[1]).toBeCloseTo(25.609, 4);
  });

  it("emits only 2-point LineString segments with flooded flags", () => {
    const route = buildCitizenEvacuationRoute(
      PATNA.lat,
      PATNA.lng,
      25.609,
      85.164,
      ZONES,
    );
    for (const segment of route.features) {
      expect(segment.geometry.type).toBe("LineString");
      expect(segment.geometry.coordinates).toHaveLength(2);
      expect(typeof segment.properties.flooded).toBe("boolean");
    }
  });

  it("marks the first segment flooded when the citizen starts in danger", () => {
    // Patna center sits inside the primary danger zone.
    const route = buildCitizenEvacuationRoute(
      PATNA.lat,
      PATNA.lng,
      25.609,
      85.164,
      ZONES,
    );
    expect(route.features[0].properties.flooded).toBe(true);
  });

  it("clears the flooded flag once the route escapes the danger zone", () => {
    // Riverside is ~5 km away; the route must contain both states.
    const route = buildCitizenEvacuationRoute(
      PATNA.lat,
      PATNA.lng,
      25.561,
      85.166,
      ZONES,
    );
    const flooded = route.features.some((s) => s.properties.flooded);
    const safe = route.features.some((s) => !s.properties.flooded);
    expect(flooded).toBe(true);
    expect(safe).toBe(true);
  });

  it("stays all-safe when both ends are far from any danger zone", () => {
    // Gaya — a different district with no flood polygons nearby.
    const route = buildCitizenEvacuationRoute(24.7955, 85.0002, 24.81, 85.03, ZONES);
    expect(route.features.every((s) => !s.properties.flooded)).toBe(true);
  });

  it("is deterministic for the same endpoints", () => {
    const a = buildCitizenEvacuationRoute(PATNA.lat, PATNA.lng, 25.609, 85.164, ZONES);
    const b = buildCitizenEvacuationRoute(PATNA.lat, PATNA.lng, 25.609, 85.164, ZONES);
    expect(a).toEqual(b);
  });
});
