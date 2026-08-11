"use client";

// ---------------------------------------------------------------------
// hooks/useBatterySaver.ts — Phase 13 · Step 8 · Hardware Battery
// Optimization.
//
// Reads the device charge via the navigator.getBattery() Web API (wrapped
// in try/catch — it's not available everywhere) and exposes a live
// `isBatteryLow` flag (level < 20%). The Citizen App uses it to:
//
//   • show the "Battery Saver Active" banner on the dashboard, and
//   • pause background auto-refresh timers (SafetyTipsFeed rotation) so
//     the phone isn't woken repeatedly on a dying battery — the citizen
//     refreshes manually via pull-to-refresh instead.
//
// Implementation notes:
//   • A module-level singleton store drives useSyncExternalStore, so any
//     number of consumers (banner + interval-gated widgets) share ONE
//     getBattery() subscription and one event listener pair — same
//     pattern as useSafetyStatus's cached snapshot (stable references are
//     mandatory for useSyncExternalStore's getSnapshot).
//   • `supported` is false on the server, in browsers without the API,
//     and when the API rejects — consumers render nothing in that case
//     (no dead UI).
//   • The SOS LocationTracker countdown is deliberately NOT gated: an
//     active emergency overrides battery savings.
// ---------------------------------------------------------------------

import { useEffect, useSyncExternalStore } from "react";

/** Below this charge fraction the app enters battery-saver mode. */
const LOW_BATTERY_THRESHOLD = 0.2;

export type BatterySnapshot = {
  /** True when the device has less than 20% charge. */
  isBatteryLow: boolean;
  /** Current charge as a fraction 0..1 (1 when unknown). */
  level: number;
  /** True while plugged in (banner shows "charging"). */
  charging: boolean;
  /** True when getBattery() exists AND resolved successfully. */
  supported: boolean;
};

/** The pre-API / unsupported / server-render snapshot (stable reference). */
export const DEFAULT_BATTERY_SNAPSHOT: BatterySnapshot = {
  isBatteryLow: false,
  level: 1,
  charging: true,
  supported: false,
};

/** Pure threshold check — exported for tests. */
export function isLowBatteryLevel(level: number): boolean {
  return level < LOW_BATTERY_THRESHOLD;
}

/** The subset of BatteryManager the store actually reads. */
type BatteryManagerLike = {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
};

/** Normalise a BatteryManager into a snapshot (defensive: the Web API is
 * loosely typed across engines — NaN/absent level ⇒ unknown/healthy). */
export function batterySnapshotFromManager(
  manager: BatteryManagerLike,
): BatterySnapshot {
  const raw = manager.level;
  const level = typeof raw === "number" && Number.isFinite(raw) ? raw : 1;
  return {
    isBatteryLow: isLowBatteryLevel(level),
    level,
    charging: Boolean(manager.charging),
    supported: true,
  };
}

// --- singleton store ----------------------------------------------------
let snapshot: BatterySnapshot = DEFAULT_BATTERY_SNAPSHOT;
const listeners = new Set<() => void>();
let manager: BatteryManagerLike | null = null;
let started = false;

function emit(): void {
  // forEach (not for…of): the project's TS target predates downlevel
  // Set iteration support.
  listeners.forEach((listener) => listener());
}

async function loadBattery(): Promise<void> {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<BatteryManagerLike>;
  };
  if (typeof nav.getBattery !== "function") return; // supported stays false
  try {
    const battery = await nav.getBattery();
    manager = battery;
    snapshot = batterySnapshotFromManager(battery);
    emit();
    const update = () => {
      if (manager) snapshot = batterySnapshotFromManager(manager);
      emit();
    };
    battery.addEventListener("levelchange", update);
    battery.addEventListener("chargingchange", update);
  } catch {
    // API present but rejected (some embedded browsers) — stay unsupported.
  }
}

/** Fetch the battery once per page load, no matter how many consumers. */
function startBatteryWatch(): void {
  if (started) return;
  started = true;
  void loadBattery();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): BatterySnapshot {
  return snapshot;
}

/** Live battery state — `isBatteryLow` drives the saver UI + timer gates. */
export function useBatterySaver(): BatterySnapshot {
  // Server snapshot is DEFAULT so SSR HTML and first client paint agree;
  // after hydration React re-reads the real snapshot via getSnapshot.
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_BATTERY_SNAPSHOT,
  );

  useEffect(() => {
    startBatteryWatch();
  }, []);

  return current;
}

export default useBatterySaver;
