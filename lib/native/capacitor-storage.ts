// ---------------------------------------------------------------------
// lib/native/capacitor-storage.ts — Phase 11 · Capacitor native storage
// bridge (Hybrid App path).
//
// When the app is packaged with Capacitor, the WebView's IndexedDB/
// localStorage can be evicted by the OS and is quota-capped. This bridge
// lets callers opt into the native storage backend instead:
//
//   const storage = createNativeStorage();
//   await storage.set("shelter:last-viewed", { id: "shelter-12" });
//   const value = await storage.get("shelter:last-viewed");
//
// Backend resolution (in order):
//   1. Capacitor Preferences plugin (native, persistent, no eviction) —
//      accessed dynamically via window.Capacitor.Plugins.Preferences so
//      this module never hard-imports an optional package.
//   2. localStorage — PWA fallback (survives page reloads, not OS eviction).
//
// The bridge is intentionally dependency-free: the @capacitor/* packages
// are optional, so the PWA build must keep working when they are absent.
// ---------------------------------------------------------------------

export type NativeStorageValue = string | number | boolean | null | object;

/** Minimal structural view of the Capacitor Preferences plugin. */
export interface CapacitorPreferencesLike {
  get: (options: { key: string }) => Promise<{ value: string | null }>;
  set: (options: { key: string; value: string }) => Promise<void>;
  remove: (options: { key: string }) => Promise<void>;
  keys: () => Promise<{ keys: string[] }>;
}

/** Structural view of the global Capacitor runtime object. */
export interface CapacitorGlobal {
  isNativePlatform: () => boolean;
  Plugins?: {
    Preferences?: CapacitorPreferencesLike;
  };
}

export type NativeStorageBackend = "capacitor" | "localstorage" | "none";

export interface NativeStorage {
  readonly backend: NativeStorageBackend;
  get: <T extends NativeStorageValue = string>(key: string) => Promise<T | null>;
  set: (key: string, value: NativeStorageValue) => Promise<void>;
  remove: (key: string) => Promise<void>;
  keys: () => Promise<string[]>;
}

/** Reads window.Capacitor defensively (never throws). */
export function detectCapacitor(globalObj: unknown = typeof window !== "undefined" ? window : undefined): CapacitorGlobal | null {
  if (!globalObj) return null;
  const capacitor = (globalObj as { Capacitor?: unknown }).Capacitor;
  if (!capacitor || typeof capacitor !== "object") return null;
  const maybe = capacitor as CapacitorGlobal;
  return typeof maybe.isNativePlatform === "function" && maybe.isNativePlatform() ? maybe : null;
}

/** True when running inside a Capacitor native WebView. */
export function isCapacitorNative(): boolean {
  return detectCapacitor() !== null;
}

/** Resolves the backend actually available on this runtime. */
export function resolveBackend(
  capacitor: CapacitorGlobal | null = detectCapacitor(),
  hasLocalStorage: boolean = typeof localStorage !== "undefined",
): NativeStorageBackend {
  if (capacitor?.Plugins?.Preferences) return "capacitor";
  if (hasLocalStorage) return "localstorage";
  return "none";
}

// ---------------------------------------------------------------------
// Backend implementations (pure, injectable for node tests)
// ---------------------------------------------------------------------

/** localStorage adapter — reads/writes JSON strings, never throws. */
function localStorageBackend(storage: Pick<Storage, "getItem" | "setItem" | "removeItem">): NativeStorage {
  return {
    backend: "localstorage",
    async get<T extends NativeStorageValue>(key: string): Promise<T | null> {
      try {
        const raw = storage.getItem(key);
        return raw === null ? null : (JSON.parse(raw) as T);
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch {
        // quota/private-mode — non-fatal
      }
    },
    async remove(key) {
      try {
        storage.removeItem(key);
      } catch {
        // non-fatal
      }
    },
    async keys() {
      try {
        return Object.keys(storage).filter((k) => Object.prototype.hasOwnProperty.call(storage, k));
      } catch {
        return [];
      }
    },
  };
}

/** Capacitor Preferences adapter — native, JSON-encoded values. */
function capacitorBackend(prefs: CapacitorPreferencesLike): NativeStorage {
  return {
    backend: "capacitor",
    async get<T extends NativeStorageValue>(key: string): Promise<T | null> {
      try {
        const { value } = await prefs.get({ key });
        return value === null || value === undefined ? null : (JSON.parse(value) as T);
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        await prefs.set({ key, value: JSON.stringify(value) });
      } catch {
        // non-fatal
      }
    },
    async remove(key) {
      try {
        await prefs.remove({ key });
      } catch {
        // non-fatal
      }
    },
    async keys() {
      try {
        const { keys } = await prefs.keys();
        return keys;
      } catch {
        return [];
      }
    },
  };
}

/** No usable storage — every op is a no-op. */
function noneBackend(): NativeStorage {
  return {
    backend: "none",
    async get() {
      return null;
    },
    async set() {},
    async remove() {},
    async keys() {
      return [];
    },
  };
}

/**
 * Creates the native-first storage bridge. Prefers Capacitor Preferences,
 * falls back to localStorage, then to a no-op. Injectable for tests:
 *
 *   createNativeStorage({ capacitor, localStorage, platformIsNative })
 */
export function createNativeStorage(options?: {
  capacitor?: CapacitorGlobal | null;
  localStorage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
}): NativeStorage {
  const capacitor = options?.capacitor !== undefined ? options.capacitor : detectCapacitor();
  const storage =
    options?.localStorage !== undefined
      ? options.localStorage
      : typeof localStorage !== "undefined"
        ? localStorage
        : null;

  if (capacitor?.Plugins?.Preferences) return capacitorBackend(capacitor.Plugins.Preferences);
  if (storage) return localStorageBackend(storage);
  return noneBackend();
}

export default createNativeStorage;