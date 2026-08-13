// ---------------------------------------------------------------------
// lib/native/capacitor-storage.test.ts — Phase 11 Capacitor storage bridge
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  createNativeStorage,
  detectCapacitor,
  resolveBackend,
  type CapacitorGlobal,
  type CapacitorPreferencesLike,
  type NativeStorageValue,
} from "./capacitor-storage";

function capacitorGlobal(prefs: unknown): CapacitorGlobal {
  return {
    isNativePlatform: () => true,
    Plugins: { Preferences: prefs as CapacitorPreferencesLike },
  };
}

/** Faithful localStorage stub: methods non-enumerable, data as enumerable
 * own props — so `Object.keys(storage)` returns exactly the stored keys,
 * mirroring the real Storage object. */
function memoryLocalStorage() {
  const store: Record<string, string> = {};
  const api: Record<string, unknown> = {};
  Object.defineProperties(api, {
    getItem: { value: (k: string) => (k in store ? store[k] : null) },
    setItem: {
      value: (k: string, v: string) => {
        store[k] = v;
        Object.defineProperty(api, k, { value: v, enumerable: true, configurable: true, writable: true });
      },
    },
    removeItem: {
      value: (k: string) => {
        delete store[k];
        delete api[k];
      },
    },
    keys: { value: () => Object.keys(api) },
  });
  return api as unknown as Pick<Storage, "getItem" | "setItem" | "removeItem"> & { keys(): string[] };
}

describe("detectCapacitor / isCapacitorNative / resolveBackend", () => {
  it("detects a native Capacitor runtime", () => {
    const capacitor = capacitorGlobal({ get: async () => ({ value: "1" }), set: async () => {}, remove: async () => {}, keys: async () => ({ keys: [] }) });
    expect(detectCapacitor({ Capacitor: capacitor })).not.toBeNull();
  });

  it("ignores a non-native Capacitor object", () => {
    expect(
      detectCapacitor({ Capacitor: { isNativePlatform: () => false, Plugins: {} } }),
    ).toBeNull();
  });

  it("returns null for runtimes without Capacitor", () => {
    expect(detectCapacitor({})).toBeNull();
    expect(detectCapacitor(undefined)).toBeNull();
  });

  it("isCapacitorNative resolves backend to capacitor when Preferences exist", () => {
    const prefs = { get: async () => ({ value: "1" }), set: async () => {}, remove: async () => {}, keys: async () => ({ keys: [] }) };
    const capacitor = capacitorGlobal(prefs);
    expect(resolveBackend(capacitor)).toBe("capacitor");
  });

  it("falls back to localstorage without the Preferences plugin", () => {
    const capacitor = { isNativePlatform: () => true, Plugins: {} };
    expect(resolveBackend(capacitor, true)).toBe("localstorage");
    expect(resolveBackend(capacitor, false)).toBe("none");
  });
});

describe("createNativeStorage — Capacitor backend", () => {
  it("round-trips a JSON value through Preferences", async () => {
    const calls: Array<{ key: string; value?: string }> = [];
    const prefs = {
      get: async ({ key }: { key: string }) => {
        const hit = calls.find((c) => c.key === key);
        return { value: hit ? (hit.value as string) : null };
      },
      set: async ({ key, value }: { key: string; value: string }) => void calls.push({ key, value }),
      remove: async ({ key }: { key: string }) => {
        const i = calls.findIndex((c) => c.key === key);
        if (i >= 0) calls.splice(i, 1);
      },
      keys: async () => ({ keys: calls.map((c) => c.key) }),
    };
    const capacitor = capacitorGlobal(prefs);
    const storage = createNativeStorage({ capacitor });

    expect(storage.backend).toBe("capacitor");
    await storage.set("shelter:last", { id: "shelter-12", dist: 1.4 });
    await expect(storage.get<{ id: string; dist: number }>("shelter:last")).resolves.toEqual({
      id: "shelter-12",
      dist: 1.4,
    });
    await storage.remove("shelter:last");
    await expect(storage.get("shelter:last")).resolves.toBeNull();
  });

  it("lists keys through Preferences.keys()", async () => {
    const prefs = {
      get: async () => ({ value: null }),
      set: async () => {},
      remove: async () => {},
      keys: async () => ({ keys: ["a", "b"] }),
    };
    const storage = createNativeStorage({ capacitor: capacitorGlobal(prefs) });
    await expect(storage.keys()).resolves.toEqual(["a", "b"]);
  });
});

describe("createNativeStorage — localStorage fallback (PWA)", () => {
  it("round-trips values and survives the JSON encoding", async () => {
    const ls = memoryLocalStorage();
    const storage = createNativeStorage({ capacitor: null, localStorage: ls });

    expect(storage.backend).toBe("localstorage");
    await storage.set("flag", true);
    await storage.set("count", 3);
    await expect(storage.get("flag")).resolves.toBe(true);
    await expect(storage.get("count")).resolves.toBe(3);
    expect(ls.getItem("count")).toBe("3");
  });

  it("returns null for missing keys and tolerates corrupt JSON", async () => {
    const ls = memoryLocalStorage();
    ls.setItem("bad", "{not json");
    const storage = createNativeStorage({ capacitor: null, localStorage: ls });
    await expect(storage.get("missing")).resolves.toBeNull();
    await expect(storage.get("bad")).resolves.toBeNull();
  });

  it("keys() returns stored keys only", async () => {
    const ls = memoryLocalStorage();
    ls.setItem("a", "1");
    ls.setItem("b", "2");
    const storage = createNativeStorage({ capacitor: null, localStorage: ls });
    await expect(storage.keys()).resolves.toEqual(["a", "b"]);
  });
});

describe("createNativeStorage — no-op backend", () => {
  it("never throws and returns null/nothing", async () => {
    const storage = createNativeStorage({ capacitor: null, localStorage: null });
    expect(storage.backend).toBe("none");
    await expect(storage.set("x", "1" as unknown as NativeStorageValue)).resolves.toBeUndefined();
    await expect(storage.get("x")).resolves.toBeNull();
    await expect(storage.keys()).resolves.toEqual([]);
  });
});
