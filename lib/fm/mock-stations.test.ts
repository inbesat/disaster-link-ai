// ---------------------------------------------------------------------
// lib/fm/mock-stations.test.ts — demo fallback station list.
// Locks the seeded mock data used by the FM API routes when the DB is
// unreachable: non-empty, covers Patna, AIR stations rank first for an
// emergency in Patna (regulatory priority: AIR first).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { MOCK_FM_STATIONS } from "./mock-stations";
import { findStationsInRadius } from "./find-stations";

// Patna — the demo's default focus district.
const PATNA = { lat: 25.5941, lng: 85.1376 };

describe("MOCK_FM_STATIONS (Phase 26 demo fallback)", () => {
  it("is non-empty and includes AIR + private + community types", () => {
    expect(MOCK_FM_STATIONS.length).toBeGreaterThan(5);
    const types = new Set(MOCK_FM_STATIONS.map((s) => s.type));
    expect(types.has("air")).toBe(true);
    expect(types.has("private")).toBe(true);
    expect(types.has("community")).toBe(true);
  });

  it("every row has coords and a coverage radius", () => {
    for (const s of MOCK_FM_STATIONS) {
      expect(typeof s.lat).toBe("number");
      expect(typeof s.lng).toBe("number");
      expect(s.coverageRadiusKm).toBeGreaterThan(0);
    }
  });

  it("finds the Patna stations within 50 km — AIR first", () => {
    const covering = findStationsInRadius(PATNA.lat, PATNA.lng, MOCK_FM_STATIONS, 50);
    expect(covering.length).toBeGreaterThanOrEqual(3);
    // Regulatory priority: the AIR station outranks the private ones.
    expect(covering[0].type).toBe("air");
    expect(covering.some((s) => s.name.includes("AIR Patna"))).toBe(true);
    expect(covering.some((s) => s.name.includes("Radio Mirchi"))).toBe(true);
  });

  it("ranks AIR first even when a private station is closer", () => {
    // Radio Mirchi sits exactly on the Patna probe point (0 km) while AIR
    // Patna is ~0.9 km out — the private station is closer, yet the AIR
    // obligation still wins.
    const covering = findStationsInRadius(PATNA.lat, PATNA.lng, MOCK_FM_STATIONS, 120);
    expect(covering[0].type).toBe("air");
  });

  it("covers Muzaffarpur with AIR Patna + the local community station", () => {
    // The private Patna stations sit ~59 km out — outside their 50 km
    // radius — but AIR Patna's 80 km reach covers Muzaffarpur, so the
    // mandatory-EWS station ranks first, ahead of Radio Mantra (local).
    const covering = findStationsInRadius(26.1225, 85.3908, MOCK_FM_STATIONS, 50);
    expect(covering.map((s) => s.name)).toEqual([
      "AIR Patna Vividh Bharati",
      "Radio Mantra 90.4",
    ]);
  });

  it("returns nothing for a remote point far from every station", () => {
    const covering = findStationsInRadius(8.52, 76.94, MOCK_FM_STATIONS, 50); // Kerala
    expect(covering).toEqual([]);
  });
});
