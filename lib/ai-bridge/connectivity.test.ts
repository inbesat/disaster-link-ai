// ---------------------------------------------------------------------
// lib/ai-bridge/connectivity.test.ts
// Unit tests for the Phase 1 ConnectivityMonitor. Verifies the
// online/offline merge (browser network AND Supabase heartbeat), the
// background heartbeat behavior, and listener delivery.
// ---------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectivityMonitor } from "./connectivity";
import type { BackendProbe } from "./connectivity";

function probe(ok: boolean): BackendProbe {
  return vi.fn(async () => ok);
}

describe("ConnectivityMonitor", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: true });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports online when the browser network and backend probe both pass", async () => {
    const monitor = new ConnectivityMonitor(probe(true));
    const snap = await monitor.heartbeat();
    expect(snap.online).toBe(true);
    expect(snap.browserOnline).toBe(true);
    expect(snap.backendReachable).toBe(true);
  });

  it("reports offline when the backend probe fails", async () => {
    const monitor = new ConnectivityMonitor(probe(false));
    const snap = await monitor.heartbeat();
    expect(snap.online).toBe(false);
    expect(snap.backendReachable).toBe(false);
  });

  it("reports offline when the browser reports no network even if probe ok", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const monitor = new ConnectivityMonitor(probe(true));
    heroInject(monitor, { browserOnline: false });
    const snap = await monitor.heartbeat();
    expect(snap.browserOnline).toBe(false);
    expect(snap.online).toBe(false);
  });

  it("delivers live snapshots to subscribers and corrects after mount", async () => {
    const monitor = new ConnectivityMonitor(probe(true));
    const seen: boolean[] = [];
    const unsub = monitor.subscribe((s) => seen.push(s.online));
    await monitor.heartbeat();
    expect(seen.length).toBeGreaterThanOrEqual(1);
    expect(seen[seen.length - 1]).toBe(true);
    unsub();
  });

  it("start() registers window listeners and schedules a heartbeat", async () => {
    const listeners: Record<string, (() => void)[]> = {};
    vi.stubGlobal("window", {
      addEventListener: vi.fn((type: string, cb: () => void) => {
        (listeners[type] ??= []).push(cb);
      }),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("setInterval", vi.fn(() => 123));

    const monitor = new ConnectivityMonitor(probe(true));
    monitor.start(15000);

    expect(window.addEventListener).toHaveBeenCalledWith("online", expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(setInterval).toHaveBeenCalled();
    monitor.stop();
    vi.unstubAllGlobals();
  });

  it("is safe to call stop() repeatedly", () => {
    const monitor = new ConnectivityMonitor(probe(true));
    expect(() => {
      monitor.stop();
      monitor.stop();
    }).not.toThrow();
  });
});

// Insert synthetic partial snapshot state (mirrors the private update path).
function heroInject(monitor: ConnectivityMonitor, partial: object): void {
  (monitor as unknown as { update(p: object): void }).update(partial);
}