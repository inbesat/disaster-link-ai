"use client";

// ---------------------------------------------------------------------
// hooks/useSafetyStatus.ts — Phase 2 · Step 3 · Dynamic Safety Status
// (mock geo-fence).
//
// Reads the citizen's saved location (localStorage `citizen_location`,
// written by the Phase 1 location setup), cross-references it against the
// mock Active Hazard Zones in lib/mock-data/hazard-zones.ts, and returns
// the calculated status + area label to feed the SafetyHero card.
//
// Hydration-safe by construction: the read goes through
// `useSyncExternalStore` with a `getServerSnapshot` of `null`, so the
// server render and the first client render agree ("Location not set"),
// and React swaps in the real localStorage value right after hydration —
// no hydration-mismatch error, no misleading flash on the status card.
// The `subscribe` also re-reads on the `storage` event, so if the citizen
// re-runs location setup in another tab the hero updates without a reload.
//
// The pure math lives in resolveSafetyStatus() (lib/mock-data/
// hazard-zones.ts) and is unit-tested there; this hook is the thin
// localStorage + state wrapper.
// ---------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import type { SafetyStatus } from "@/lib/mock-data/hazard-zones";
import {
  formatSavedAt,
  resolveSafetyStatus,
  type CitizenLocation,
} from "@/lib/mock-data/hazard-zones";

const STORAGE_KEY = "citizen_location";

// Last raw payload seen + its parsed snapshot.
//
// useSafetyStatus feeds this into useSyncExternalStore's getSnapshot, which
// MUST return a stable reference between renders. JSON.parse builds a fresh
// object on every call, so React sees a "new" store value each render and
// re-renders forever — "Maximum update depth exceeded" on the public
// dashboard. The snapshot is only rebuilt when the stored value changes
// (cross-tab edits arrive via the storage event → subscribe →
// onStoreChange).
let cachedRaw: string | null = null;
let cachedLocation: CitizenLocation | null = null;

/** Read the saved location (mirrors readSidebarCollapsed's guard style). */
export function readCitizenLocation(): CitizenLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedLocation;
    if (!raw) {
      cachedRaw = raw;
      cachedLocation = null;
      return cachedLocation;
    }
    const parsed = JSON.parse(raw) as CitizenLocation;
    const location: CitizenLocation | null =
      (parsed.type === "gps" || parsed.type === "manual") &&
      typeof parsed.savedAt === "string"
        ? parsed
        : null;
    // Commit the cache only after a successful parse — if JSON.parse
    // throws below, the stale cache is left untouched and the catch
    // returns a stable null (a primitive, so Object.is stays true).
    cachedRaw = raw;
    cachedLocation = location;
    return cachedLocation;
  } catch {
    return null;
  }
}

/** Subscribe to cross-tab location changes (storage events). */
function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export type SafetyStatusResult = {
  /** Calculated risk — feed straight into <SafetyHero status={…} />. */
  status: SafetyStatus;
  /** Human area label, e.g. "Kankarbagh, Patna". */
  area: string;
  /** ISO savedAt → "HH:MM:SS IST" readout, undefined when no location. */
  updatedAt: string | undefined;
};

export function useSafetyStatus(): SafetyStatusResult {
  // Server snapshot is always null (no location during SSR); after
  // hydration React re-reads the real value via getSnapshot.
  const location = useSyncExternalStore(
    subscribe,
    () => readCitizenLocation(),
    () => null,
  );

  const resolved = resolveSafetyStatus(location);
  return {
    status: resolved.status,
    area: resolved.area,
    updatedAt: formatSavedAt(location?.savedAt),
  };
}
