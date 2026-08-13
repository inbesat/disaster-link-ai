// ---------------------------------------------------------------------
// lib/perf/battery-gate.ts — Offline-First Architecture · Phase 10
// Battery-aware sync gating: pause background sync when the device charge
// drops below 20%, so a phone on a dying battery isn't woken repeatedly
// by the sync engine (radio wakes drain power fastest).
//
//   const gate = await getBatteryGate();
//   gate.shouldPauseSync()   // true when level < 0.2 and not charging
//
// Built on the existing useBatterySaver singleton (hooks/useBatterySaver.ts)
// but usable outside React (BackgroundSyncInit, service worker sync ticks).
// Pure helpers are exported for tests; the store is a single shared
// subscription like the battery saver's.
// ---------------------------------------------------------------------

import { batterySnapshotFromManager } from "@/hooks/useBatterySaver";

/** Below this charge fraction background sync pauses (spec: 20%). */
export const BATTERY_SYNC_PAUSE_THRESHOLD = 0.2;

export interface BatteryGateState {
  /** Charge as a fraction 0..1 (1 when unknown). */
  level: number;
  /** True while plugged in — charging overrides the pause. */
  charging: boolean;
  /** True when the battery API resolved (otherwise we assume healthy). */
  supported: boolean;
}

/** Default pre-API state — assume healthy (no pause) like the saver hook. */
export const DEFAULT_BATTERY_GATE: BatteryGateState = {
  level: 1,
  charging: true,
  supported: false,
};

/** Pure rule: pause sync when charge is below the threshold AND not charging. */
export function shouldPauseSyncForBattery(state: BatteryGateState): boolean {
  if (!state.supported) return false;
  if (state.charging) return false;
  return state.level < BATTERY_SYNC_PAUSE_THRESHOLD;
}

/** True when charge is healthy enough to sync. */
export function batteryAllowsSync(state: BatteryGateState): boolean {
  return !shouldPauseSyncForBattery(state);
}

/** How long to wait (ms) before retrying a sync paused by low battery. */
export function batteryRetryDelayMs(state: BatteryGateState): number {
  // Recheck every 5 minutes while paused.
  return shouldPauseSyncForBattery(state) ? 5 * 60 * 1000 : 0;
}

// --- singleton store (mirrors useBatterySaver's pattern) ---------------
type BatteryManagerLike = {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
};

let state: BatteryGateState = DEFAULT_BATTERY_GATE;
const listeners = new Set<() => void>();
let started = false;
/** Demo-mode override — `null` means follow the real battery API. */
let simulated: BatteryGateState | null = null;

function emit(): void {
  listeners.forEach((l) => l());
}

/**
 * Demo-mode override for the battery gate: forces the reported charge so the
 * "Simulate Low Battery" scenario can pause sync without needing a real
 * battery. Pass `null` to restore the real battery API state.
 */
export function setSimulatedBattery(
  level: number | null,
  charging = false,
): void {
  if (level === null) {
    simulated = null;
  } else {
    simulated = { level, charging, supported: true };
  }
  emit();
}

/** Current simulated charge — `null` when following the real battery. */
export function getSimulatedBattery(): BatteryGateState | null {
  return simulated;
}

async function loadBatteryGate(): Promise<void> {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<BatteryManagerLike>;
  };
  if (typeof nav.getBattery !== "function") return;
  try {
    const battery = await nav.getBattery();
    const snapshot = batterySnapshotFromManager(battery as Parameters<typeof batterySnapshotFromManager>[0]);
    state = {
      level: snapshot.level,
      charging: snapshot.charging,
      supported: true,
    };
    emit();
    const update = () => {
      const s = batterySnapshotFromManager(battery as Parameters<typeof batterySnapshotFromManager>[0]);
      state = { level: s.level, charging: s.charging, supported: true };
      emit();
    };
    battery.addEventListener("levelchange", update);
    battery.addEventListener("chargingchange", update);
  } catch {
    // API rejected — stays unsupported (healthy assumption).
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getState(): BatteryGateState {
  return simulated ?? state;
}

/**
 * Battery gate for the sync engine: `shouldPauseSync()` tells callers to
 * skip a sync run; `onChange(cb)` lets the engine resume automatically the
 * moment the device starts charging or crosses back above 20%.
 */
export function createBatteryGate() {
  if (!started) {
    started = true;
    void loadBatteryGate();
  }
  return {
    getState,
    shouldPauseSync: () => shouldPauseSyncForBattery(simulated ?? state),
    onChange: subscribe,
  };
}

/** Async variant for non-hook callers (BackgroundSyncInit, SW ticks). */
export async function getBatteryGate() {
  return createBatteryGate();
}

export default createBatteryGate;
