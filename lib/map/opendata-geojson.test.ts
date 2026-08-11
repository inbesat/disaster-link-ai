// Step 10 — open-data GeoJSON builder tests: FeatureCollection validity,
// point geometry, null-geometry alerts, and coordinate ordering.
import { describe, it, expect } from "vitest";
import { buildOpenDataFeatureCollection } from "./opendata-geojson";
import type { PublicSafeAlert, PublicSafeShelter } from "@/lib/security/sanitize";

const shelters: PublicSafeShelter[] = [
  {
    id: "s1",
    name: "Patna Central Community Hall",
    district: "Patna",
    lat: 25.609,
    lng: 85.164,
    capacity: 100,
    currentOccupancy: 45,
    status: "open",
    facilities: { food: true, medical: true },
    imageUrl: null,
    updatedAt: new Date("2026-08-10T00:00:00Z"),
  },
];

const alerts: PublicSafeAlert[] = [
  {
    id: "a1",
    severity: "critical",
    message: "Brahmaputra above danger mark — evacuate now.",
    district: "Kamrup",
    sentAt: new Date("2026-08-11T06:00:00Z"),
    createdAt: new Date("2026-08-11T06:00:00Z"),
  },
];

describe("buildOpenDataFeatureCollection", () => {
  it("emits a valid FeatureCollection with one feature per row", () => {
    const fc = buildOpenDataFeatureCollection(shelters, alerts);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(2);
  });

  it("emits shelters as Point features with lng,lat coordinate order", () => {
    const fc = buildOpenDataFeatureCollection(shelters, []);
    const shelterFeature = fc.features[0];
    // Geometry is a union (incl. GeometryCollection); narrow for the test.
    const point = shelterFeature.geometry as { type: "Point"; coordinates: number[] };
    expect(point.type).toBe("Point");
    expect(point.coordinates).toEqual([85.164, 25.609]);
    expect(shelterFeature.properties.kind).toBe("shelter");
    expect(shelterFeature.properties.name).toBe("Patna Central Community Hall");
    expect(shelterFeature.properties.current_occupancy).toBe(45);
    expect(shelterFeature.properties.updated_at).toBe("2026-08-10T00:00:00.000Z");
  });

  it("emits alerts as null-geometry features carrying the payload", () => {
    const fc = buildOpenDataFeatureCollection([], alerts);
    const alertFeature = fc.features[0];
    expect(alertFeature.geometry).toBeNull();
    expect(alertFeature.properties.kind).toBe("alert");
    expect(alertFeature.properties.severity).toBe("critical");
    expect(alertFeature.properties.sent_at).toBe("2026-08-11T06:00:00.000Z");
  });

  it("never carries gov-only fields in the properties", () => {
    const fc = buildOpenDataFeatureCollection(shelters, alerts);
    for (const feature of fc.features) {
      expect(feature.properties.contactPerson).toBeUndefined();
      expect(feature.properties.phone).toBeUndefined();
      expect(feature.properties.operationalNotes).toBeUndefined();
      expect(feature.properties.channel).toBeUndefined();
      expect(feature.properties.triggerCondition).toBeUndefined();
    }
  });
});
