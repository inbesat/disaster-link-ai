import { describe, expect, it } from "vitest";
import {
  validateCoordinates,
  roundCoordinatePrecision,
  anonymizePublicLocation,
  clampSearchRadius,
  logLocationAudit,
  locationAuditLogs,
  validateGeoJSON,
} from "./geospatial-security";

describe("Geospatial & Map Data Security", () => {
  it("validates coordinate boundaries (-90..90 lat, -180..180 lng)", () => {
    expect(validateCoordinates(25.61, 85.14).valid).toBe(true);
    expect(validateCoordinates(95, 85.14).valid).toBe(false);
    expect(validateCoordinates(25.61, 195).valid).toBe(false);
    expect(validateCoordinates("invalid", 85.14).valid).toBe(false);
  });

  it("rounds coordinate precision to prevent precision leaks", () => {
    const coords = roundCoordinatePrecision(25.612345678, 85.141234567, 4);
    expect(coords.lat).toBe(25.6123);
    expect(coords.lng).toBe(85.1412);
  });

  it("anonymizes public location data according to privacy level", () => {
    // Coarse (~1km) for public responder overview
    const coarse = anonymizePublicLocation(25.612345, 85.141234, "coarse");
    expect(coarse.lat).toBe(25.61);
    expect(coarse.lng).toBe(85.14);

    // Neighborhood (~100m) for public shelter views
    const hood = anonymizePublicLocation(25.612345, 85.141234, "neighborhood");
    expect(hood.lat).toBe(25.612);
    expect(hood.lng).toBe(85.141);
  });

  it("clamps spatial query radius to maximum 100km", () => {
    expect(clampSearchRadius(15)).toBe(15);
    expect(clampSearchRadius(250)).toBe(100);
    expect(clampSearchRadius(0)).toBe(10);
  });

  it("tracks location access audit logs", () => {
    logLocationAudit("usr_admin_10", "responder_gps", "Patna_District");
    const last = locationAuditLogs[locationAuditLogs.length - 1];
    expect(last.userId).toBe("usr_admin_10");
    expect(last.dataType).toBe("responder_gps");
    expect(last.locationContext).toBe("Patna_District");
  });

  it("validates GeoJSON polygon structure and limits vertex count to 1000", () => {
    const validGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [85.1, 25.6],
                [85.2, 25.6],
                [85.2, 25.7],
                [85.1, 25.7],
                [85.1, 25.6],
              ],
            ],
          },
        },
      ],
    };
    const res = validateGeoJSON(validGeoJSON);
    expect(res.valid).toBe(true);
    expect(res.vertexCount).toBe(5);

    // Dense GeoJSON polygon > 1000 vertices
    const denseCoords = Array.from({ length: 1005 }, (_, i) => [85.0 + i * 0.0001, 25.0 + i * 0.0001]);
    const denseGeoJSON = {
      type: "Polygon",
      coordinates: [denseCoords],
    };
    const denseRes = validateGeoJSON(denseGeoJSON);
    expect(denseRes.valid).toBe(false);
    expect(denseRes.vertexCount).toBe(1005);
    expect(denseRes.reason).toContain("exceeds limit of 1000 vertices");
  });
});
