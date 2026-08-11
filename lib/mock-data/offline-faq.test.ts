// ---------------------------------------------------------------------
// lib/mock-data/offline-faq.test.ts — Phase 6 · Step 6 · pure matcher
// semantics (no browser required).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { matchOfflineFaq, OFFLINE_FAQ } from "./offline-faq";

describe("OFFLINE_FAQ", () => {
  it("covers exactly five questions with unique ids", () => {
    expect(OFFLINE_FAQ).toHaveLength(5);
    const ids = OFFLINE_FAQ.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every faq has at least one match keyword", () => {
    for (const faq of OFFLINE_FAQ) {
      expect(faq.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe("matchOfflineFaq", () => {
  it("matches the water question (the spec example)", () => {
    expect(matchOfflineFaq("Do I need to boil water before drinking?")?.id).toBe("water");
  });

  it("matches on a bare keyword", () => {
    expect(matchOfflineFaq("nearest shelter")?.id).toBe("shelter");
    expect(matchOfflineFaq("power is out")?.id).toBe("power");
    expect(matchOfflineFaq("how do I charge my phone")?.id).toBe("phone");
    expect(matchOfflineFaq("is the road open")?.id).toBe("road");
  });

  it("matches Hindi queries", () => {
    expect(matchOfflineFaq("पानी कैसे सुरक्षित रखें")?.id).toBe("water");
    expect(matchOfflineFaq("नज़दीकी आश्रय कहाँ है")?.id).toBe("shelter");
  });

  it("is case-insensitive", () => {
    expect(matchOfflineFaq("BOIL Water")?.id).toBe("water");
  });

  it("returns null for empty or unmatched queries", () => {
    expect(matchOfflineFaq("")).toBeNull();
    expect(matchOfflineFaq("   ")).toBeNull();
    expect(matchOfflineFaq("tell me a joke about floods")).toBeNull();
  });

  it("most specific keyword wins — 'waterlogged' beats the 'water' substring", () => {
    expect(matchOfflineFaq("is the road waterlogged?")?.id).toBe("road");
  });

  it("a plain water query still lands on the water FAQ", () => {
    expect(matchOfflineFaq("do I need to boil water?")?.id).toBe("water");
  });
});
