// ---------------------------------------------------------------------
// lib/offline-sync/sw-sync.test.ts — Phase 7 · one-shot background sync
// registration (SyncManager bridge). Pure node tests with injected globals.
// ---------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import {
  BG_SYNC_TAGS,
  requestBackgroundSync,
  requestPeriodicSync,
  supportsBackgroundSync,
  supportsPeriodicSync,
  unregisterPeriodicSync,
} from "./sw-sync";

/** Fake minimal window for the SyncManager feature probe. */
function withWindow(hasSyncManager: boolean) {
  const original = globalThis.window;
  (globalThis as unknown as { window: unknown }).window = hasSyncManager
    ? { SyncManager: true }
    : {};
  return () => {
    if (original === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window: unknown }).window = original;
  };
}

function mockNavigator(hasServiceWorker: boolean) {
  const original = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: hasServiceWorker ? { serviceWorker: {} } : {},
  });
  return () => Object.defineProperty(globalThis, "navigator", { configurable: true, value: original });
}

describe("supportsBackgroundSync", () => {
  it("is false without a service worker", () => {
    const restore = mockNavigator(false);
    const restoreWindow = withWindow(true);
    expect(supportsBackgroundSync()).toBe(false);
    restoreWindow();
    restore();
  });

  it("is false without the SyncManager API", () => {
    const restore = mockNavigator(true);
    const restoreWindow = withWindow(false);
    expect(supportsBackgroundSync()).toBe(false);
    restoreWindow();
    restore();
  });

  it("is true when both exist", () => {
    const restore = mockNavigator(true);
    const restoreWindow = withWindow(true);
    expect(supportsBackgroundSync()).toBe(true);
    restoreWindow();
    restore();
  });
});

describe("requestBackgroundSync", () => {
  it("registers the tag through SyncManager", async () => {
    const restore = mockNavigator(true);
    const restoreWindow = withWindow(true);
    const register = () => Promise.resolve();
    const ready = Promise.resolve({ sync: { register } });
    Object.defineProperty(globalThis.navigator, "serviceWorker", {
      configurable: true,
      value: { ready },
    });
    const spy = (globalThis.navigator as { serviceWorker: { ready: Promise<unknown> } }).serviceWorker;
    Object.defineProperty(spy, "ready", { value: ready });

    const ok = await requestBackgroundSync(BG_SYNC_TAGS.predictions);
    expect(ok).toBe(true);
    restoreWindow();
    restore();
  });

  it("resolves false when registration throws", async () => {
    const restore = mockNavigator(true);
    const restoreWindow = withWindow(true);
    const ready = Promise.resolve({
      sync: {
        register: () => Promise.reject(new Error("quota")),
      },
    });
    Object.defineProperty(globalThis.navigator, "serviceWorker", {
      configurable: true,
      value: { ready },
    });

    const ok = await requestBackgroundSync(BG_SYNC_TAGS.alerts);
    expect(ok).toBe(false);
    restoreWindow();
    restore();
  });

  it("resolves false when SyncManager is absent", async () => {
    const restore = mockNavigator(true);
    const restoreWindow = withWindow(false);
    const ok = await requestBackgroundSync(BG_SYNC_TAGS.predictions);
    expect(ok).toBe(false);
    restoreWindow();
    restore();
  });
});

// --- Phase 11 · periodic background sync (background-fetch config) -------

/** Stub the global `window` with navigator.serviceWorker + periodicSync. */
function mockPeriodicSyncContext(periodicSync?: {
  register?: (tag: string, opts: { minInterval: number }) => Promise<void>;
  unregister?: (tag: string) => Promise<void>;
}) {
  const restoreNav = mockNavigator(true);
  const originalWindow = globalThis.window;
  (globalThis as unknown as { window: unknown }).window = {
    SyncManager: true,
    PeriodicSyncManager: true,
  };
  const ready = Promise.resolve({ periodicSync });
  Object.defineProperty(globalThis.navigator, "serviceWorker", {
    configurable: true,
    value: { ready },
  });
  return () => {
    if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window: unknown }).window = originalWindow;
    restoreNav();
  };
}

describe("supportsPeriodicSync / requestPeriodicSync / unregisterPeriodicSync", () => {
  it("supportsPeriodicSync is false without a periodicSync API", () => {
    const restore = mockNavigator(true);
    const restoreWindow = withWindow(true); // { SyncManager: true } only
    Object.defineProperty(globalThis.navigator, "serviceWorker", {
      configurable: true,
      value: {},
    });
    expect(supportsPeriodicSync()).toBe(false);
    restoreWindow();
    restore();
  });

  it("registers the 3h periodic tag and reports support", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    const restore = mockPeriodicSyncContext({ register });
    const ok = await requestPeriodicSync();
    expect(ok).toBe(true);
    expect(register).toHaveBeenCalledWith("disasterlink-sync", { minInterval: 3 * 60 * 60 * 1000 });
    restore();
  });

  it("requestPeriodicSync resolves false when unsupported", async () => {
    const restore = mockNavigator(true);
    const restoreWindow = withWindow(true);
    Object.defineProperty(globalThis.navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve({}) },
    });
    await expect(requestPeriodicSync()).resolves.toBe(false);
    restoreWindow();
    restore();
  });

  it("unregisterPeriodicSync removes the tag when supported", async () => {
    const unregister = vi.fn().mockResolvedValue(undefined);
    const restore = mockPeriodicSyncContext({ unregister });
    await expect(unregisterPeriodicSync()).resolves.toBe(true);
    expect(unregister).toHaveBeenCalledWith("disasterlink-sync");
    restore();
  });

  it("unregisterPeriodicSync resolves false when the API is absent", async () => {
    const restore = mockNavigator(true);
    const restoreWindow = withWindow(true);
    Object.defineProperty(globalThis.navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve({}) },
    });
    await expect(unregisterPeriodicSync()).resolves.toBe(false);
    restoreWindow();
    restore();
  });
});