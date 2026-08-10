// lib/mock-data/family-contacts.test.ts — regression test for the
// "Maximum update depth exceeded" crash on the public dashboard.
//
// FamilyStrip feeds readFamilyContacts() into useSyncExternalStore's
// getSnapshot, which must return a STABLE reference between renders.
// Re-parsing localStorage on every call makes React see a "new" snapshot
// each render and loop forever; this file locks the caching in.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFamilyContacts } from "./family-contacts";

const KEY = "citizen_family_contacts";
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

const payload = (name: string, phone: string) =>
  JSON.stringify({ contacts: [{ name, phone }] });

describe("readFamilyContacts — snapshot stability", () => {
  beforeEach(() => {
    fakeStorage.clear();
    vi.stubGlobal("window", { localStorage: fakeStorage });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the same reference across calls while data is unchanged", () => {
    store[KEY] = payload("Sunita Das", "+919000000001");
    const first = readFamilyContacts();
    const second = readFamilyContacts();
    // Object.is-stable → useSyncExternalStore sees no store change → no loop.
    expect(first).toBe(second);
    expect(first).toHaveLength(1);
    expect(first[0].status).toBe("safe");
  });

  it("returns the same empty-array reference when nothing is stored", () => {
    const first = readFamilyContacts();
    const second = readFamilyContacts();
    expect(first).toBe(second);
    expect(first).toEqual([]);
  });

  it("returns a new reference only when the stored payload changes", () => {
    store[KEY] = payload("Sunita Das", "+919000000001");
    const before = readFamilyContacts();
    // Simulate a cross-tab edit (storage event → onStoreChange → getSnapshot).
    store[KEY] = payload("Rahul Mehta", "+919000000002");
    const after = readFamilyContacts();
    expect(after).not.toBe(before);
    expect(after[0].name).toBe("Rahul Mehta");
    // …and the fresh snapshot is itself stable.
    expect(readFamilyContacts()).toBe(after);
  });

  it("stays stable when malformed JSON is stored", () => {
    store[KEY] = "{not-json";
    const first = readFamilyContacts();
    const second = readFamilyContacts();
    expect(first).toBe(second);
    expect(first).toEqual([]);
  });
});
