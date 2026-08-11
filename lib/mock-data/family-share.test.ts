// ---------------------------------------------------------------------
// lib/mock-data/family-share.test.ts — Phase 13 · Step 9 · share-link
// determinism, validity rules and label mapping.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  SHARE_STATUS_LABELS,
  getSharedCitizen,
  hashShareId,
} from "./family-share";

describe("getSharedCitizen", () => {
  it("is deterministic: the same shareId always resolves to the same citizen", () => {
    const a = getSharedCitizen("family-9f2k", new Date("2026-08-11T06:00:00Z"));
    const b = getSharedCitizen("family-9f2k", new Date("2026-08-11T09:00:00Z"));
    expect(a?.name).toBe(b?.name);
    expect(a?.status).toBe(b?.status);
    expect(a?.district).toBe(b?.district);
    expect(a?.statusLabel).toBe(b?.statusLabel);
  });

  it("returns a labelled status with the safety emoji prefix", () => {
    const citizen = getSharedCitizen("family-abc123");
    expect(citizen?.statusLabel).toMatch(/^(🟢|🟡|🟠|🔴)/);
    expect(SHARE_STATUS_LABELS[citizen!.status]).toBe(citizen?.statusLabel);
  });

  it("resolves a real district and name for any valid token", () => {
    const citizen = getSharedCitizen("share-zz9");
    expect(citizen?.name.length ?? 0).toBeGreaterThan(2);
    expect(citizen?.district.length ?? 0).toBeGreaterThan(2);
  });

  it("stamps an updatedAt between 2 minutes and 2 hours before asOf", () => {
    const asOf = new Date("2026-08-11T06:00:00Z");
    const citizen = getSharedCitizen("family-xyz", asOf)!;
    const ageMin = (asOf.getTime() - citizen.updatedAt.getTime()) / 60_000;
    expect(ageMin).toBeGreaterThanOrEqual(2);
    expect(ageMin).toBeLessThanOrEqual(120);
  });

  it("returns null for tokens too short to be a real share link", () => {
    expect(getSharedCitizen("")).toBeNull();
    expect(getSharedCitizen("abc")).toBeNull();
    expect(getSharedCitizen("   ")).toBeNull();
  });

  it("ignores surrounding whitespace on the token", () => {
    expect(getSharedCitizen("  family-xyz  ")?.name).toBe(
      getSharedCitizen("family-xyz")?.name,
    );
  });
});

describe("hashShareId", () => {
  it("is stable across calls", () => {
    expect(hashShareId("family-9f2k")).toBe(hashShareId("family-9f2k"));
  });

  it("spreads different tokens to different hashes", () => {
    const a = hashShareId("family-aaaa");
    const b = hashShareId("family-bbbb");
    expect(a).not.toBe(b);
  });
});
