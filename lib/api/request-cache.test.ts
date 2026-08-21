import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  STALE_TIMES,
  clearRequestCache,
  fetchWithDedupeAndCache,
  isPollingAllowed,
} from "./request-cache";

describe("request-cache", () => {
  beforeEach(() => {
    clearRequestCache();
  });

  it("has correct staleTime values for each entity", () => {
    expect(STALE_TIMES.userProfile).toBe(5 * 60 * 1000); // 5 min
    expect(STALE_TIMES.shelterData).toBe(2 * 60 * 1000); // 2 min
    expect(STALE_TIMES.floodPredictions).toBe(60 * 1000); // 1 min
    expect(STALE_TIMES.resourceInventory).toBe(30 * 1000); // 30 sec
  });

  it("deduplicates simultaneous in-flight requests", async () => {
    let callCount = 0;
    const fetcher = vi.fn(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return { id: "res-1", status: "ok" };
    });

    const [r1, r2] = await Promise.all([
      fetchWithDedupeAndCache("test-key", fetcher, 5000),
      fetchWithDedupeAndCache("test-key", fetcher, 5000),
    ]);

    expect(r1).toEqual(r2);
    expect(callCount).toBe(1);
  });

  it("returns cached result when within staleTime", async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { count: callCount };
    };

    const first = await fetchWithDedupeAndCache("cache-test", fetcher, 10000);
    expect(first).toEqual({ count: 1 });

    const second = await fetchWithDedupeAndCache("cache-test", fetcher, 10000);
    expect(second).toEqual({ count: 1 });
    expect(callCount).toBe(1);
  });

  it("aborts outdated request when a new forceRefresh request is fired for the same key", async () => {
    let aborted = false;
    const slowFetcher = (signal: AbortSignal) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve("slow"), 100);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          aborted = true;
          reject(new Error("Aborted"));
        });
      });

    const fastFetcher = async () => "fast";

    const p1 = fetchWithDedupeAndCache("cancel-key", slowFetcher, 5000).catch((e) => e.message);
    const p2 = fetchWithDedupeAndCache("cancel-key", fastFetcher, 5000, { forceRefresh: true });

    const [res1, res2] = await Promise.all([p1, p2]);
    expect(res1).toBe("Aborted");
    expect(res2).toBe("fast");
    expect(aborted).toBe(true);
  });

  it("correctly identifies when polling is allowed based on document.visibilityState", () => {
    expect(isPollingAllowed()).toBe(true);
  });
});
