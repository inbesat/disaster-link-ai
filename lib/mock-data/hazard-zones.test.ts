// lib/mock-data/hazard-zones.test.ts — Phase 2 · Step 3.
// Locks the mock geo-fence logic: manual district/village matching,
// village-level escalation, GPS nearest-centroid matching, and the
// no-location / out-of-fence fallbacks.

import { describe, expect, it } from "vitest";
import {
  formatSavedAt,
  haversineKm,
  resolveSafetyStatus,
  type CitizenLocation,
} from "./hazard-zones";

const manual = (
  district: string,
  village: string,
  savedAt = "2026-08-09T09:42:17.000Z",
): CitizenLocation => ({ type: "manual", district, village, savedAt });

describe("resolveSafetyStatus — manual location", () => {
  it("matches a district and returns its risk level", () => {
    const res = resolveSafetyStatus(manual("Patna", "Kankarbagh"));
    expect(res.status).toBe("WATCH");
    expect(res.area).toBe("Kankarbagh, Patna");
    expect(res.zone?.district).toBe("Patna");
  });

  it("is case-insensitive on the district name", () => {
    expect(resolveSafetyStatus(manual("patna", "Fatuha")).status).toBe("WATCH");
  });

  it("applies a village-level escalation override", () => {
    expect(resolveSafetyStatus(manual("Patna", "Barh")).status).toBe("EVACUATE");
    expect(resolveSafetyStatus(manual("Patna", "Danapur")).status).toBe("PREPARE");
  });

  it("uses the district level for villages without an override", () => {
    expect(resolveSafetyStatus(manual("Muzaffarpur", "Kanti")).status).toBe("PREPARE");
  });

  it("treats unknown districts as SAFE", () => {
    const res = resolveSafetyStatus(manual("Narnia", "Somewhere"));
    expect(res.status).toBe("SAFE");
    expect(res.zone).toBeNull();
  });
});

describe("resolveSafetyStatus — GPS location", () => {
  it("matches the nearest district centroid within the radius", () => {
    // ~Purnia centre
    const res = resolveSafetyStatus({
      type: "gps",
      lat: 25.78,
      lng: 87.48,
      savedAt: "x",
    });
    expect(res.status).toBe("EVACUATE");
    expect(res.area).toBe("Purnia area");
  });

  it("falls back to SAFE outside every hazard fence", () => {
    // Mumbai — far from every Bihar district centre
    const res = resolveSafetyStatus({
      type: "gps",
      lat: 19.076,
      lng: 72.8777,
      savedAt: "x",
    });
    expect(res.status).toBe("SAFE");
    expect(res.area).toBe("Outside monitored zones");
    expect(res.zone).toBeNull();
  });
});

describe("resolveSafetyStatus — no location", () => {
  it("returns SAFE with a placeholder area", () => {
    const res = resolveSafetyStatus(null);
    expect(res.status).toBe("SAFE");
    expect(res.area).toBe("Location not set");
    expect(res.zone).toBeNull();
  });
});

describe("haversineKm", () => {
  it("returns ~0 for identical points and sane km for real cities", () => {
    expect(haversineKm(25.5941, 85.1376, 25.5941, 85.1376)).toBeLessThan(0.001);
    const patnaToPurnia = haversineKm(25.5941, 85.1376, 25.7767, 87.4755);
    expect(patnaToPurnia).toBeGreaterThan(200);
    expect(patnaToPurnia).toBeLessThan(250);
  });
});

describe("formatSavedAt", () => {
  it("formats an ISO timestamp to IST clock time", () => {
    expect(formatSavedAt("2026-08-09T09:42:17.000Z")).toBe("15:12:17 IST");
  });

  it("returns undefined for empty/invalid input", () => {
    expect(formatSavedAt(undefined)).toBeUndefined();
    expect(formatSavedAt("not-a-date")).toBeUndefined();
  });
});
