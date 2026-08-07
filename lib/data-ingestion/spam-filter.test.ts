// Phase 17 Step 7 — spam & duplicate detection tests.
import { describe, it, expect } from "vitest";
import { detectSpam, type SpamCandidate } from "./spam-filter";

const now = Date.now();

function report(
  lat: number,
  lng: number,
  rawText: string,
  createdAt: number = now,
): SpamCandidate {
  return { lat, lng, rawText, createdAt };
}

describe("detectSpam (Phase 17)", () => {
  it("allows a clean, unique report", () => {
    const existing = [
      report(25.6, 85.1, "Water entering ground floor in Kankarbagh", now - 120_000),
    ];
    expect(
      detectSpam(report(25.7, 85.2, "Rescue needed near Danapur bridge"), existing),
    ).toEqual({ isSpam: false });
  });

  it("rejects an exact duplicate text, regardless of casing/punctuation", () => {
    const existing = [report(25.6, 85.1, "Water entering ground floor Kankarbagh #flood", now - 10_000)];
    const dup = detectSpam(
      report(25.9, 85.3, "water entering ground floor kankarbagh flood"),
      existing,
    );
    expect(dup.isSpam).toBe(true);
    expect(dup.reason).toBe("duplicate_text");
  });

  it("rejects >5 reports from the same location within a minute", () => {
    const manyExisting = Array.from({ length: 5 }, (_, i) =>
      report(25.6, 85.1, `spam message ${i}`, now - (i * 5000 + 10_000)),
    );
    const result = detectSpam(report(25.6, 85.1, "another near-identical blast"), manyExisting);
    expect(result.isSpam).toBe(true);
    expect(result.reason).toBe("location_flood");
  });

  it("allows 5 reports within the window (threshold is >5)", () => {
    const existing = Array.from({ length: 5 }, (_, i) =>
      report(25.6, 85.1, `spam message ${i}`, now - i * 10_000),
    );
    // 5 existing + 1 new = 6 recent from that cell → spam.
    const atThreshold = existing.slice(0, 4); // 4 existing; 1 new → 5 total
    expect(detectSpam(report(25.6, 85.1, "okay report"), atThreshold).isSpam).toBe(false);
    expect(detectSpam(report(25.6, 85.1, "okay report"), existing).isSpam).toBe(true);
  });

  it("ignores old reports outside the 60s window for the location rule", () => {
    const old = [
      report(25.6, 85.1, "old report 1", now - 5 * 60_000),
      report(25.6, 85.1, "old report 2", now - 4 * 60_000),
      report(25.6, 85.1, "old report 3", now - 3 * 60_000),
      report(25.6, 85.1, "old report 4", now - 2 * 60_000),
      report(25.6, 85.1, "old report 5", now - 90_000),
    ];
    const result = detectSpam(report(25.6, 85.1, "a fresh unique text"), old);
    expect(result.isSpam).toBe(false);
  });
});