// hooks/useSafetyStatus.test.ts — regression test for the same
// "Maximum update depth exceeded" crash: useSafetyStatus feeds
// readCitizenLocation() into useSyncExternalStore's getSnapshot, which
// must return a STABLE reference between renders. JSON.parse builds a
// fresh object every call, so without caching React loops forever.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readCitizenLocation } from "./useSafetyStatus";

const KEY = "citizen_location";
// Plain-object store (no Map — tsconfig targets ES5, no downlevelIteration).
const store: Record<string, string> = {};
const fakeStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
  key: () => null,
  get length() {
    return Object.keys(store).length;
  },
};

const manualLocation = JSON.stringify({
  type: "manual",
  district: "Patna",
  village: "Kankarbagh",
  savedAt: "2026-08-09T09:42:17.000Z",
});
const gpsLocation = JSON.stringify({
  type: "gps",
  lat: 25.78,
  lng: 87.48,
  savedAt: "2026-08-09T09:42:17.000Z",
});

describe("readCitizenLocation — snapshot stability", () => {
  beforeEach(() => {
    fakeStorage.clear();
    vi.stubGlobal("window", { localStorage: fakeStorage });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the same reference across calls while data is unchanged", () => {
    store[KEY] = manualLocation;
    const first = readCitizenLocation();
    const second = readCitizenLocation();
    // Object.is-stable → useSyncExternalStore sees no store change → no loop.
    expect(first).toBe(second);
    expect(first).toMatchObject({ type: "manual", district: "Patna" });
  });

  it("returns the stable null reference when nothing is stored", () => {
    expect(readCitizenLocation()).toBeNull();
    expect(readCitizenLocation()).toBeNull();
  });

  it("returns a new reference only when the stored value changes", () => {
    store[KEY] = manualLocation;
    const before = readCitizenLocation();
    // Simulate a cross-tab edit (storage event → onStoreChange → getSnapshot).
    store[KEY] = gpsLocation;
    const after = readCitizenLocation();
    expect(after).not.toBe(before);
    expect(after).toMatchObject({ type: "gps" });
    // …and the fresh snapshot is itself stable.
    expect(readCitizenLocation()).toBe(after);
  });

  it("stays null (stable) when malformed JSON is stored", () => {
    store[KEY] = "{not-json";
    expect(readCitizenLocation()).toBeNull();
    expect(readCitizenLocation()).toBeNull();
  });
});
