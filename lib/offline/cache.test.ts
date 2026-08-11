// ---------------------------------------------------------------------
// lib/offline/cache.test.ts — Phase 1 · Step 10 · Offline route cache
// tests.
// ---------------------------------------------------------------------

import { beforeEach, describe, expect, it, vi } from "vitest";
import { shelterDistanceKm } from "@/lib/map/citizen-shelters";
import {
  buildOfflineRouteCache,
  isOfflineCacheFresh,
  loadOfflineRouteCache,
  OFFLINE_CACHE_KEY,
  OFFLINE_CACHE_MAX_AGE_MS,
  OFFLINE_SHELTER_LIMIT,
  saveOfflineRouteCache,
  type OfflineRouteCache,
} from "./cache";

// The default citizen map centre (Patna).
const CENTER = { lat: 25.5941, lng: 85.1376 };

describe("buildOfflineRouteCache", () => {
  it("ships the nearest shelters with a route geometry each", () => {
    const cache = buildOfflineRouteCache(CENTER.lat, CENTER.lng);

    expect(cache.version).toBe(1);
    expect(typeof cache.savedAt).toBe("number");
    expect(cache.shelters).toHaveLength(OFFLINE_SHELTER_LIMIT);
    for (const shelter of cache.shelters) {
      const route = cache.routes[shelter.id];
      expect(route).toBeDefined();
      expect(route.length).toBeGreaterThan(0);
      expect(route[0].geometry.type).toBe("LineString");
    }
  });

  it("sorts shelters by distance from the given centre", () => {
    const cache = buildOfflineRouteCache(CENTER.lat, CENTER.lng);
    const distances = cache.shelters.map((s) => shelterDistanceKm(s, CENTER.lat, CENTER.lng));
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1] - 1e-9);
    }
  });

  it("includes the full help-center directory", () => {
    const cache = buildOfflineRouteCache(CENTER.lat, CENTER.lng);
    expect(cache.centers.length).toBeGreaterThan(2);
    expect(cache.centers[0].phone).toBeTruthy();
  });

  it("generates identical geometry for the same centre (deterministic)", () => {
    const a = buildOfflineRouteCache(CENTER.lat, CENTER.lng);
    const b = buildOfflineRouteCache(CENTER.lat, CENTER.lng);
    const firstA = a.routes[a.shelters[0].id][0].geometry.coordinates;
    const firstB = b.routes[b.shelters[0].id][0].geometry.coordinates;
    expect(firstA).toEqual(firstB);
  });
});

describe("save / load / freshness", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
      },
    });
  });

  it("round-trips a cache through localStorage", () => {
    const cache = buildOfflineRouteCache(CENTER.lat, CENTER.lng);
    expect(saveOfflineRouteCache(cache)).toBe(true);
    const loaded = loadOfflineRouteCache();
    expect(loaded).not.toBeNull();
    expect(loaded?.shelters).toEqual(cache.shelters);
    expect(loaded?.routes[cache.shelters[0].id]).toEqual(cache.routes[cache.shelters[0].id]);
    expect(isOfflineCacheFresh(loaded)).toBe(true);
  });

  it("rejects a stale cache outside the 24 h window", () => {
    const cache: OfflineRouteCache = {
      ...buildOfflineRouteCache(CENTER.lat, CENTER.lng),
      savedAt: Date.now() - OFFLINE_CACHE_MAX_AGE_MS - 1,
    };
    saveOfflineRouteCache(cache);
    expect(isOfflineCacheFresh(loadOfflineRouteCache())).toBe(false);
  });

  it("returns null when nothing is stored", () => {
    expect(loadOfflineRouteCache()).toBeNull();
    expect(isOfflineCacheFresh(null)).toBe(false);
  });

  it("rejects corrupt or wrong-version payloads", () => {
    store.set(OFFLINE_CACHE_KEY, "{not json");
    expect(loadOfflineRouteCache()).toBeNull();

    store.set(OFFLINE_CACHE_KEY, JSON.stringify({ version: 2, savedAt: Date.now() }));
    expect(loadOfflineRouteCache()).toBeNull();
  });
});

describe("isOfflineCacheFresh", () => {
  it("honours an explicit now timestamp", () => {
    const cache = buildOfflineRouteCache(CENTER.lat, CENTER.lng);
    expect(isOfflineCacheFresh(cache, cache.savedAt + OFFLINE_CACHE_MAX_AGE_MS)).toBe(true);
    expect(
      isOfflineCacheFresh(cache, cache.savedAt + OFFLINE_CACHE_MAX_AGE_MS + 1),
    ).toBe(false);
  });
});