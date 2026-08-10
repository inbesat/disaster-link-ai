// ---------------------------------------------------------------------
// lib/mock-data/alert-preferences.ts — Phase 3 · Step 5 · public alert
// preferences.
//
// What the citizen wants to be pinged for, saved to localStorage
// (`citizen_alert_preferences`) from /public/settings/alerts. This is
// the single edit point for the preference model — a real notification
// engine later reads the same shape.
//
//   • types      — Floods / Cyclones / Earthquakes toggles. The current
//                  mock feed only carries flood/rain/road alerts, so
//                  only "Floods" has anything to hide today (disabling
//                  Cyclones/Earthquakes changes nothing until such
//                  alerts exist — which is honest: you'll be pinged
//                  when they do).
//   • severity   — "Only Critical" / "Watch + Critical" / "All Alerts"
//                  segmented control (critical / warning+critical / all).
//   • quietHours — 10 PM – 6 AM quiet window; the "Critical Life-Safety
//                  Alerts always bypass Quiet Hours" escape hatch is
//                  permanently locked ON (life-safety must always break
//                  through — see the settings page).
// ---------------------------------------------------------------------

import type { PublicAlert } from "./public-alerts";

export type AlertTypePref = "flood" | "cyclone" | "earthquake";
export type SeverityPref = "critical" | "watch-critical" | "all";

export type AlertPreferences = {
  /** One toggle per alert type. */
  types: Record<AlertTypePref, boolean>;
  /** Severity floor for notifications. */
  severity: SeverityPref;
  /** Quiet hours master switch (10 PM – 6 AM). */
  quietHours: boolean;
};

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  types: { flood: true, cyclone: true, earthquake: true },
  severity: "all",
  quietHours: false,
};

const STORAGE_KEY = "citizen_alert_preferences";
const TYPES: AlertTypePref[] = ["flood", "cyclone", "earthquake"];
const SEVERITIES: SeverityPref[] = ["critical", "watch-critical", "all"];

/** Validate an unknown payload against the model, merging over defaults so
 * missing/renamed fields degrade gracefully instead of wiping the prefs. */
export function parseAlertPreferences(raw: string | null): AlertPreferences {
  if (!raw) return { ...DEFAULT_ALERT_PREFERENCES };
  try {
    const parsed = JSON.parse(raw) as Partial<AlertPreferences>;
    const types = { ...DEFAULT_ALERT_PREFERENCES.types };
    const parsedTypes = parsed.types;
    if (parsedTypes && typeof parsedTypes === "object") {
      for (const key of TYPES) {
        if (typeof parsedTypes[key] === "boolean") types[key] = parsedTypes[key];
      }
    }
    return {
      types,
      severity: SEVERITIES.includes(parsed.severity as SeverityPref)
        ? (parsed.severity as SeverityPref)
        : DEFAULT_ALERT_PREFERENCES.severity,
      quietHours:
        typeof parsed.quietHours === "boolean"
          ? parsed.quietHours
          : DEFAULT_ALERT_PREFERENCES.quietHours,
    };
  } catch {
    return { ...DEFAULT_ALERT_PREFERENCES };
  }
}

/** SSR-safe read — defaults on the server, real value on the client. */
export function readAlertPreferences(): AlertPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_ALERT_PREFERENCES };
  try {
    return parseAlertPreferences(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULT_ALERT_PREFERENCES };
  }
}

/** Persist — called on every settings change (guarded, never throws). */
export function writeAlertPreferences(prefs: AlertPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable (private mode) — prefs just won't persist
  }
}

/**
 * Apply the citizen's preferences to the feed. Type filtering maps the
 * mock alert types onto the preference keys (only "flood" has matching
 * alerts today; cyclone/earthquake have none to hide). Severity: the
 * citizen-facing labels map to critical / warning+critical / all.
 */
export function filterAlertsByPreferences(
  alerts: PublicAlert[],
  prefs: AlertPreferences,
): PublicAlert[] {
  const byType = alerts.filter(
    (alert) => prefs.types.flood || alert.type !== "flood", // rain/road are always shown
  );
  switch (prefs.severity) {
    case "critical":
      return byType.filter((a) => a.severity === "critical");
    case "watch-critical":
      return byType.filter((a) => a.severity !== "safe");
    case "all":
    default:
      return byType;
  }
}
