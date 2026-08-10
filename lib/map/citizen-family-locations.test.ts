// ---------------------------------------------------------------------
// lib/map/citizen-family-locations.test.ts — Phase 4 · Step 8 locations.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { haversineKm } from "@/lib/mock-data/hazard-zones";
import { parseFamilyContacts } from "@/lib/mock-data/family-contacts";
import {
  familyMemberLocation,
  withFamilyLocations,
} from "./citizen-family-locations";

/** Default citizen location (Patna) — matches the demo district. */
const CENTER = { lat: 25.5941, lng: 85.1376 };

/** A saved family-circle payload exactly as the Phase 1 setup writes it. */
const SAVED_PAYLOAD = JSON.stringify({
  contacts: [
    { name: "Sunita Das", phone: "+919876543210" },
    { name: "Rahul Das", phone: "+919876543211" },
    { name: "Meera Das", phone: "+919876543212" },
  ],
  savedAt: "2026-08-01T10:00:00.000Z",
});

describe("familyMemberLocation", () => {
  it("is deterministic for the same center and index", () => {
    const a = familyMemberLocation(CENTER.lat, CENTER.lng, 2);
    const b = familyMemberLocation(CENTER.lat, CENTER.lng, 2);
    expect(a).toEqual(b);
  });

  it("keeps every member within 3 km of the citizen", () => {
    for (let i = 0; i < 5; i++) {
      const loc = familyMemberLocation(CENTER.lat, CENTER.lng, i);
      const km = haversineKm(CENTER.lat, CENTER.lng, loc.lat, loc.lng);
      expect(km).toBeLessThan(3);
      expect(km).toBeGreaterThan(0.4); // never sits on the citizen's own pin
    }
  });

  it("spreads members so they don't stack on each other", () => {
    const points = [0, 1, 2, 3].map((i) => familyMemberLocation(CENTER.lat, CENTER.lng, i));
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const km = haversineKm(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
        expect(km).toBeGreaterThan(0.15);
      }
    }
  });
});

describe("withFamilyLocations", () => {
  it("preserves every contact and their mock status", () => {
    const contacts = parseFamilyContacts(SAVED_PAYLOAD);
    const located = withFamilyLocations(contacts, CENTER.lat, CENTER.lng);
    expect(located).toHaveLength(3);
    expect(located.map((m) => m.name)).toEqual(["Sunita Das", "Rahul Das", "Meera Das"]);
    expect(located.map((m) => m.phone)).toEqual([
      "+919876543210",
      "+919876543211",
      "+919876543212",
    ]);
    for (const member of located) {
      expect(["safe", "unknown", "danger"]).toContain(member.status);
      expect(typeof member.lat).toBe("number");
      expect(typeof member.lng).toBe("number");
    }
  });

  it("returns [] when there are no saved family members", () => {
    expect(withFamilyLocations([], CENTER.lat, CENTER.lng)).toEqual([]);
  });
});
