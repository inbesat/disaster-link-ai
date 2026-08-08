"use client";

// ---------------------------------------------------------------------
// lib/settings/MapSettingsContext.tsx — compatibility shim.
//
// The central map-preferences store moved to lib/map-settings-store.ts
// (Phase 3 · Step 10). This module re-exports it so existing imports keep
// working; prefer the canonical entry point for new code.
// ---------------------------------------------------------------------

export {
  MapPreferencesProvider as MapSettingsProvider,
  useMapPreferences,
  useMapSettings,
} from "@/lib/map-settings-store";