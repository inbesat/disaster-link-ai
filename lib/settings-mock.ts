"use client";

// ---------------------------------------------------------------------
// lib/settings-mock.ts — unified Settings persistence store (Settings · Phase 10).
//
// Single source of truth for the /settings/profile mock state. Every card
// (identity, visibility, localization) reads and writes through this one
// store instead of owning private localStorage keys, so:
//   • One key ("drip_profile_settings_v2") holds the whole profile snapshot.
//   • Edits sync ACROSS BROWSER TABS — the `storage` event fires in every
//     other tab whenever localStorage changes; a same-tab custom event keeps
//     the current tab honest too.
//   • Older per-card keys (v1) are migrated on first read so no demo data
//     is lost.
//   • Falls back to realistic NDRF Commander demo data when storage is empty.
//
// useProfileSettings() is the hook all cards call. It is deliberately
// framework-safe (no react-hook-form) so forms/selects/toggles can rehydrate
// from it however they like.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import type { Designation } from "@/lib/validations/user";

/** Unified localStorage key for the whole profile settings snapshot. */
export const PROFILE_SETTINGS_KEY = "drip_profile_settings_v2";

/** Same-tab sync event — fired after a local write so mounted components
 *  (including non-React listeners) refresh immediately. */
export const PROFILE_SETTINGS_SYNC_EVENT = "drip:profile-settings-sync";

/** Legacy per-card keys (Phases 2/7/8) — migrated into the unified store. */
export const LEGACY_KEYS = {
  identity: "drip_profile_settings_v1",
  visibility: "drip_profile_visibility_v1",
  localization: "drip_localization_prefs_v1",
} as const;

export type ProfileVisibility = "public" | "limited" | "private";

export type ProfileSettings = {
  // Identity (Phase 2)
  fullName: string;
  displayName: string;
  phone: string;
  bio: string;
  designation: Designation;
  role: string;
  assignedDistrict: string;
  // Visibility & GPS (Phase 8)
  visibility: ProfileVisibility;
  shareLiveGps: boolean;
  // Localization (Phase 7)
  timezone: string;
  region: string;
  language: Locale;
};

/** Realistic NDRF Commander demo data — used whenever storage is empty. */
export const NDRF_COMMANDER_DEFAULTS: ProfileSettings = {
  fullName: "Cmdr. Asha Verma",
  displayName: "asha.v",
  phone: "+91 98765 43210",
  bio: "NDRF District Commander leading flood relief operations in Patna.",
  designation: "NDRF",
  role: "district_admin",
  assignedDistrict: "Patna",
  visibility: "limited",
  shareLiveGps: true,
  timezone: "Asia/Kolkata",
  region: "Bihar",
  language: "en",
};

function isVisibility(value: unknown): value is ProfileVisibility {
  return value === "public" || value === "limited" || value === "private";
}

function readJsonSafe<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJsonSafe(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / unavailable — in-memory state still applies this tab
  }
}

/** Build the unified snapshot: unified key wins, then legacy per-card keys,
 *  then NDRF Commander defaults. */
function loadProfileSettings(): ProfileSettings {
  const unified = readJsonSafe<Partial<ProfileSettings>>(PROFILE_SETTINGS_KEY);
  const identity = readJsonSafe<Partial<ProfileSettings>>(LEGACY_KEYS.identity);
  const visibility = readJsonSafe<{ visibility?: ProfileVisibility; shareLiveGps?: boolean }>(
    LEGACY_KEYS.visibility,
  );
  const localization = readJsonSafe<{ timezone?: string; region?: string }>(
    LEGACY_KEYS.localization,
  );

  const designations: readonly string[] = [
    "NDRF",
    "SDRF",
    "NGO",
    "Govt Official",
    "Citizen Volunteer",
  ];

  return {
    ...NDRF_COMMANDER_DEFAULTS,
    ...identity,
    ...visibility,
    ...localization,
    // validated overrides
    ...(unified?.designation && designations.includes(unified.designation)
      ? { designation: unified.designation as Designation }
      : {}),
    ...(unified?.visibility && isVisibility(unified.visibility)
      ? { visibility: unified.visibility }
      : {}),
    ...(typeof unified?.shareLiveGps === "boolean"
      ? { shareLiveGps: unified.shareLiveGps }
      : {}),
    ...(unified?.language && isLocale(unified.language)
      ? { language: unified.language }
      : {}),
    ...(unified?.fullName ? { fullName: unified.fullName } : {}),
    ...(unified?.displayName ? { displayName: unified.displayName } : {}),
    ...(unified?.phone ? { phone: unified.phone } : {}),
    ...(unified?.bio !== undefined ? { bio: unified.bio } : {}),
    ...(unified?.timezone ? { timezone: unified.timezone } : {}),
    ...(unified?.region ? { region: unified.region } : {}),
  };
}

export type UseProfileSettingsResult = {
  /** Current settings snapshot. */
  settings: ProfileSettings;
  /** Persist a partial update locally + notify every tab. */
  update: (patch: Partial<ProfileSettings>) => void;
  /** Reset the profile to NDRF Commander demo defaults. */
  reset: () => void;
};

/**
 * React hook for the unified settings store.
 *
 * Hydration: reads synchronously (matching SSR defaults so there is no
 * mismatch), then keeps listening to cross-tab `storage` events and the
 * same-tab custom sync event.
 */
export function useProfileSettings(): UseProfileSettingsResult {
  const [settings, setSettings] = useState<ProfileSettings>(loadProfileSettings);

  // Cross-tab sync — the `storage` event fires in OTHER tabs when this tab
  // writes localStorage; the custom event covers same-tab writes.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PROFILE_SETTINGS_KEY) return;
      setSettings(loadProfileSettings());
    };
    const onSync = () => setSettings(loadProfileSettings());
    window.addEventListener("storage", onStorage);
    window.addEventListener(PROFILE_SETTINGS_SYNC_EVENT, onSync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PROFILE_SETTINGS_SYNC_EVENT, onSync);
    };
  }, []);

  const update = useCallback((patch: Partial<ProfileSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJsonSafe(PROFILE_SETTINGS_KEY, next);
      window.dispatchEvent(new CustomEvent(PROFILE_SETTINGS_SYNC_EVENT));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    writeJsonSafe(PROFILE_SETTINGS_KEY, NDRF_COMMANDER_DEFAULTS);
    window.dispatchEvent(new CustomEvent(PROFILE_SETTINGS_SYNC_EVENT));
    setSettings(NDRF_COMMANDER_DEFAULTS);
  }, []);

  const value = useMemo(
    () => ({ settings, update, reset }),
    [settings, update, reset],
  );

  return value;
}

/** Non-hook read for code paths that can't use React (e.g. event handlers). */
export function readProfileSettings(): ProfileSettings {
  return loadProfileSettings();
}