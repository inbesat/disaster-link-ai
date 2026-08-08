"use client";

// ---------------------------------------------------------------------
// lib/map-settings-store.ts — Settings Integration & State Sync (Phase 3 · Step 10).
//
// Centralized store for every variable defined across this phase (default
// view, layers, display, hazards/opacity, performance, accessibility and
// offline cache). Single source of truth:
//
//   • useMapPreferences() reads → localStorage-backed React context.
//   • Every settings input calls update(patch) → same-state snapshot in
//     React + immediately persisted to localStorage (no page refresh).
//   • A "Map settings saved!" toast fires on every change (stable id, so
//     slider drags replace the toast instead of stacking).
//
// Mount once near the app root (app/layout.tsx) so both /settings/map and
// the /dashboard command-center map consume the same snapshot.
// ---------------------------------------------------------------------

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import {
  DRIP_MAP_SETTINGS_KEY,
  cloneDefaultMapSettings,
  mergeMapSettings,
  readStoredMapSettings,
  writeStoredMapSettings,
  type MapSettings,
} from "@/lib/settings/map-settings";

const SAVED_TOAST_ID = "drip-map-settings-saved";

export type MapPreferencesContextValue = {
  /** Latest snapshot — same object every consumer renders. */
  settings: MapSettings;
  /** Apply a shallow patch (e.g. `update({ layers: {...} })`). */
  update: (patch: Partial<MapSettings>) => void;
  /** Reset every map tweak back to the shipped defaults. */
  reset: () => void;
};

const MapPreferencesContext = createContext<MapPreferencesContextValue | null>(
  null,
);

export function MapPreferencesProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MapSettings>(cloneDefaultMapSettings);

  // Hydrate persisted values once after mount — no hydration mismatch.
  useEffect(() => {
    setSettings((prev) => readStoredMapSettings() ?? prev);
  }, []);

  // Persist on every change (also captures the hydration snapshot).
  useEffect(() => {
    writeStoredMapSettings(settings);
  }, [settings]);

  // Cross-tab sync: edits in a second tab update this one live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRIP_MAP_SETTINGS_KEY) return;
      try {
        if (!event.newValue) return;
        setSettings(mergeMapSettings(JSON.parse(event.newValue)));
      } catch {
        // corrupt cross-tab write — ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<MapSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
      defaultView: patch.defaultView
        ? { ...prev.defaultView, ...patch.defaultView }
        : prev.defaultView,
      layers: patch.layers ? { ...prev.layers, ...patch.layers } : prev.layers,
      display: patch.display
        ? { ...prev.display, ...patch.display }
        : prev.display,
      hazards: patch.hazards
        ? { ...prev.hazards, ...patch.hazards }
        : prev.hazards,
      performance: patch.performance
        ? { ...prev.performance, ...patch.performance }
        : prev.performance,
      accessibility: patch.accessibility
        ? { ...prev.accessibility, ...patch.accessibility }
        : prev.accessibility,
      cache: patch.cache ? { ...prev.cache, ...patch.cache } : prev.cache,
    }));
    toast("Map settings saved!", { id: SAVED_TOAST_ID });
  }, []);

  const reset = useCallback(() => {
    setSettings(cloneDefaultMapSettings());
    toast("Map settings reset to defaults.", { id: SAVED_TOAST_ID });
  }, []);

  const value = useMemo(
    () => ({ settings, update, reset }),
    [settings, update, reset],
  );

  return createElement(
    MapPreferencesContext.Provider,
    { value },
    children,
  );
}

/** Canonical hook for reading/writing the map preferences from any client component. */
export function useMapPreferences(): MapPreferencesContextValue {
  const ctx = useContext(MapPreferencesContext);
  if (!ctx) {
    throw new Error("useMapPreferences must be used inside <MapPreferencesProvider>");
  }
  return ctx;
}

/** Compat alias — older components may import this name. */
export const useMapSettings = useMapPreferences;
export const MapSettingsProvider = MapPreferencesProvider;