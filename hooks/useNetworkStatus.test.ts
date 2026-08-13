// ---------------------------------------------------------------------
// hooks/useNetworkStatus.test.ts — Phase 7 · pure helper tests (node-env).
// The hook itself is browser-coupled; formatAge is exported pure so the
// pill-label formatting is verifiable here.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { formatAge } from "./useNetworkStatus";

describe("formatAge", () => {
  it("reports just now under a minute", () => {
    expect(formatAge(5_000, true)).toBe("just now");
    expect(formatAge(5_000, false)).toBe("just now");
  });

  it("formats minutes with the online/offline suffix", () => {
    expect(formatAge(5 * 60_000, true)).toBe("5 min ago");
    expect(formatAge(2 * 60_000, false)).toBe("2 min old");
  });

  it("formats hours", () => {
    expect(formatAge(2 * 3600_000, true)).toBe("2h ago");
    expect(formatAge(2 * 3600_000, false)).toBe("2h old");
  });

  it("formats days", () => {
    expect(formatAge(3 * 24 * 3600_000, false)).toBe("3d old");
  });

  it("handles unknown age", () => {
    expect(formatAge(Number.POSITIVE_INFINITY, true)).toBe("never synced");
    expect(formatAge(Number.POSITIVE_INFINITY, false)).toBe("no data");
  });
});