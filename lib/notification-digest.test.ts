import { describe, expect, it } from "vitest";
import {
  DEFAULT_DIGEST_TIME,
  deliveryLabel,
  formatTimeLabel,
} from "./notification-digest";

// ---------------------------------------------------------------------
// lib/notification-digest.test.ts — digest batching audit (Step 7):
//   • default delivery is 08:00 AM
//   • formatTimeLabel renders human 12-hour labels
//   • only non-critical rows batch; critical always stays instant
// ---------------------------------------------------------------------

describe("DEFAULT_DIGEST_TIME", () => {
  it("is 08:00 AM", () => {
    expect(DEFAULT_DIGEST_TIME).toBe("08:00");
    expect(formatTimeLabel(DEFAULT_DIGEST_TIME)).toBe("8:00 AM");
  });
});

describe("formatTimeLabel", () => {
  it("converts 24h to a 12-hour label", () => {
    expect(formatTimeLabel("22:00")).toBe("10:00 PM");
    expect(formatTimeLabel("06:00")).toBe("6:00 AM");
    expect(formatTimeLabel("12:00")).toBe("12:00 PM");
    expect(formatTimeLabel("00:15")).toBe("12:15 AM");
  });

  it("falls back to 8:00 AM for malformed input", () => {
    expect(formatTimeLabel("")).toBe("8:00 AM");
    expect(formatTimeLabel("abc")).toBe("8:00 AM");
  });
});

describe("deliveryLabel", () => {
  it("stays instant when the digest is off", () => {
    expect(deliveryLabel(false, false)).toEqual({
      label: "Instant",
      batched: false,
    });
    expect(deliveryLabel(false, true)).toEqual({
      label: "Instant",
      batched: false,
    });
  });

  it("batches routine rows when the digest is on", () => {
    expect(deliveryLabel(true, false)).toEqual({
      label: "Batched",
      batched: true,
    });
  });

  it("keeps critical rows instant even when digesting", () => {
    expect(deliveryLabel(true, true)).toEqual({
      label: "Instant",
      batched: false,
    });
  });
});