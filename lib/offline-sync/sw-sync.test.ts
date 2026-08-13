// ---------------------------------------------------------------------
// lib/offline-sync/sw-sync.test.ts — Phase 7 · one-shot background sync
// registration (SyncManager bridge). Pure node tests with injected globals.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  BG_SYNC_TAGS,
  requestBackgroundSync,
  supportsBackgroundSync,
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