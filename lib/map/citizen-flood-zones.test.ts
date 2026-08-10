import { describe, expect, it } from "vitest";
import { booleanPointInPolygon } from "@turf/turf";
import { CITIZEN_SHELTERS } from "./citizen-shelters";
import { generateCitizenFloodZones } from "./citizen-flood-zones";

// Patna — the demo default citizen location.
const LAT = 25.5941;
const LNG = 85.1376;

describe("generateCitizenFloodZones", () => {
  it("returns exactly 2 large danger polygons", () => {
    const zones = generateCitizenFloodZones(LAT, LNG);
    expect(zones.features).toHaveLength(2);
    for (const zone of zones.features) {
      expect(zone.geometry.type).toBe("Polygon");
      expect(zone.properties.zone).toBe("danger");
      // A "large" polygon ring — turf circles have 64+ points.
      expect(zone.geometry.coordinates[0].length).toBeGreaterThan(8);
    }
  });

  it("always covers the citizen's own position", () => {
    const zones = generateCitizenFloodZones(LAT, LNG);
    const inside = zones.features.some((zone) =>
      booleanPointInPolygon([LNG, LAT], zone),
    );
    expect(inside).toBe(true);
  });

  it("keeps every mock shelter outside the danger zones", () => {
    const zones = generateCitizenFloodZones(LAT, LNG);
    for (const shelter of CITIZEN_SHELTERS) {
      const inside = zones.features.some((zone) =>
        booleanPointInPolygon([shelter.lng, shelter.lat], zone),
      );
      expect(inside, `${shelter.name} must stay outside danger zones`).toBe(false);
    }
  });

  it("is deterministic for the same center", () => {
    expect(generateCitizenFloodZones(LAT, LNG)).toEqual(
      generateCitizenFloodZones(LAT, LNG),
    );
  });
});
