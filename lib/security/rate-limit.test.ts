// Phase 21 — in-memory rate limiter tests: allowance/remaining, exhaustion,
// sliding-window reset, per-identifier isolation, and bucket reset.
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  rateLimit,
  createRateLimiter,
  resetRateLimits,
  rateLimitBucketCount,
  MAX_TRACKED_IDENTIFIERS,
} from "./rate-limit";

beforeEach(() => {
  vi.useFakeTimers();
  resetRateLimits();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests under the limit and reports remaining slots", () => {
    const first = rateLimit("ip-1", 3, 60_000);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(2);

    const second = rateLimit("ip-1", 3, 60_000);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(1);

    const third = rateLimit("ip-1", 3, 60_000);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("rejects requests beyond the limit with remaining 0", () => {
    rateLimit("ip-1", 2, 60_000);
    rateLimit("ip-1", 2, 60_000);
    const blocked = rateLimit("ip-1", 2, 60_000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    // Still blocked on further attempts.
    expect(rateLimit("ip-1", 2, 60_000).success).toBe(false);
  });

  it("opens the window again after windowMs elapses", () => {
    rateLimit("ip-1", 1, 60_000);
    expect(rateLimit("ip-1", 1, 60_000).success).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(rateLimit("ip-1", 1, 60_000).success).toBe(true);
  });

  it("slides the window: old timestamps fall out and free capacity", () => {
    const limit = 2;
    rateLimit("ip-1", limit, 10_000);
    vi.advanceTimersByTime(9_000); // oldest request still inside (9s < 10s)
    rateLimit("ip-1", limit, 10_000);
    expect(rateLimit("ip-1", limit, 10_000).success).toBe(false);

    // 1s later the first request is 10s old → it drops out of the window.
    vi.advanceTimersByTime(1_000);
    expect(rateLimit("ip-1", limit, 10_000).success).toBe(true);
  });

  it("exposes a resetTime that corresponds to the oldest in-window request", () => {
    vi.setSystemTime(1_000_000);
    rateLimit("ip-1", 2, 60_000);
    vi.advanceTimersByTime(5_000);
    const result = rateLimit("ip-1", 2, 60_000);
    // Oldest request was at t=1_000_000 → window clears at t=1_060_000.
    expect(result.resetTime).toBe(1_060_000);
  });

  it("keeps identifiers independent", () => {
    for (let i = 0; i < 5; i++) rateLimit("ip-abuser", 5, 60_000);
    expect(rateLimit("ip-abuser", 5, 60_000).success).toBe(false);

    expect(rateLimit("ip-calm", 5, 60_000).success).toBe(true);
    expect(rateLimit("ip-calm", 5, 60_000).remaining).toBe(3);
  });

  it("resetRateLimits clears all buckets", () => {
    rateLimit("ip-1", 1, 60_000);
    expect(rateLimitBucketCount()).toBe(1);
    resetRateLimits();
    expect(rateLimitBucketCount()).toBe(0);
    expect(rateLimit("ip-1", 1, 60_000).success).toBe(true);
  });

  it("sweeps fully-expired buckets once the identifier count grows large", () => {
    // Simulate a rotating-IP attacker: far more identifiers than the cap.
    for (let i = 0; i < MAX_TRACKED_IDENTIFIERS + 50; i++) {
      rateLimit(`rotating-ip-${i}`, 1, 60_000);
    }
    expect(rateLimitBucketCount()).toBe(MAX_TRACKED_IDENTIFIERS + 50);

    // After the window elapses, the next call sweeps the expired buckets.
    vi.advanceTimersByTime(60_001);
    rateLimit("new-caller", 1, 60_000);
    expect(rateLimitBucketCount()).toBe(1);
  });
});

describe("createRateLimiter", () => {
  it("binds a fixed limit and window for a named budget", () => {
    const chatLimiter = createRateLimiter(2, 30_000);
    expect(chatLimiter("user-7").success).toBe(true);
    expect(chatLimiter("user-7").success).toBe(true);
    expect(chatLimiter("user-7").success).toBe(false);
    expect(chatLimiter("user-8").success).toBe(true); // different user unaffected
  });
});
