"use client";

// ---------------------------------------------------------------------
// lib/settings/useNotificationSettings.ts — Settings · Phase 2 · Step 10.
//
// Single reactive store for the /settings/notifications page. Every
// toggle, picker, slider and badge reads AND writes through this hook, so
// a refresh restores the exact same configuration.
//
// Hydration safety (zero Next.js hydration errors):
//   • useState is seeded with pure defaults — identical on the server and
//     the first client render.
//   • Real persisted values are applied once in a post-hydration effect.
//   • The `storage` event keeps other tabs in sync.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ToneId } from "@/lib/alert-tone";
import { DEFAULT_DIGEST_TIME } from "@/lib/notification-digest";
import { DEFAULT_RADIUS_INDEX, RADIUS_OPTIONS } from "@/lib/notification-radius";
import {
  DEFAULT_THRESHOLDS,
  initialRoutes,
  setThreshold,
  type CategoryKey,
  type ChannelKey,
  type Routes,
  type SeverityThreshold,
  type Thresholds,
} from "@/lib/notification-routing";

export const NOTIFICATION_SETTINGS_KEY = "drip_notification_settings_v1";

const DEFAULT_QUIET_START = "22:00";
const DEFAULT_QUIET_END = "06:00";
const DEFAULT_SMART_START = "23:00";
const DEFAULT_SMART_END = "07:00";

export type NotificationSettings = {
  // Master pause (Step 1)
  paused: boolean;
  // Routing matrix (Step 2/3)
  routes: Routes;
  thresholds: Thresholds;
  // Daily digest (Step 7)
  digestEnabled: boolean;
  digestTime: string;
  // Quiet hours / DND (Step 4)
  dndEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  overrideDndCritical: boolean;
  // Geospatial radius (Step 5)
  radiusIndex: number;
  homeDistrictAlerts: boolean;
  // Alert audio (Step 6)
  tone: ToneId;
  hapticsEnabled: boolean;
};

export function createDefaultSettings(): NotificationSettings {
  return {
    paused: false,
    routes: initialRoutes(),
    thresholds: { ...DEFAULT_THRESHOLDS },
    digestEnabled: false,
    digestTime: DEFAULT_DIGEST_TIME,
    dndEnabled: false,
    quietStart: DEFAULT_QUIET_START,
    quietEnd: DEFAULT_QUIET_END,
    overrideDndCritical: true,
    radiusIndex: DEFAULT_RADIUS_INDEX,
    homeDistrictAlerts: true,
    tone: "standard_siren",
    hapticsEnabled: true,
  };
}

/** Smart-detect overnight window used by the Quiet Hours card. */
export const SMART_WINDOW = {
  start: DEFAULT_SMART_START,
  end: DEFAULT_SMART_END,
} as const;

/**
 * Pure merge — folds a partial persisted snapshot over the defaults.
 * Guards against malformed/corrupt JSON: string-valued keys that don't match
 * the expected shape fall back to defaults, and unknown route/threshold keys
 * are dropped rather than whitelisted into the store.
 */
export function mergeSettingsSnapshot(
  parsed: Partial<NotificationSettings> | null | undefined,
): NotificationSettings {
  const base = createDefaultSettings();
  if (!parsed || typeof parsed !== "object") return base;

  const routes = { ...base.routes };
  if (parsed.routes && typeof parsed.routes === "object") {
    for (const categoryKey of Object.keys(routes) as CategoryKey[]) {
      const savedCategory = parsed.routes[categoryKey];
      if (!savedCategory || typeof savedCategory !== "object") continue;
      for (const channel of Object.keys(routes[categoryKey]) as ChannelKey[]) {
        const savedChannel = savedCategory[channel];
        if (typeof savedChannel === "boolean") {
          routes[categoryKey][channel] = savedChannel;
        }
      }
    }
  }

  const thresholds = {
    ...base.thresholds,
    ...(parsed.thresholds && typeof parsed.thresholds === "object"
      ? parsed.thresholds
      : {}),
  };

  return {
    ...base,
    ...parsed,
    routes,
    thresholds,
    tone:
      typeof parsed.tone === "string" &&
      (["standard_siren", "digital_chime", "harsh_beep", "silent"] as ToneId[])
        .includes(parsed.tone as ToneId)
        ? parsed.tone
        : base.tone,
    quietStart:
      typeof parsed.quietStart === "string" && /^\d{2}:\d{2}$/.test(parsed.quietStart)
        ? parsed.quietStart
        : base.quietStart,
    quietEnd:
      typeof parsed.quietEnd === "string" && /^\d{2}:\d{2}$/.test(parsed.quietEnd)
        ? parsed.quietEnd
        : base.quietEnd,
    digestTime:
      typeof parsed.digestTime === "string" && /^\d{2}:\d{2}$/.test(parsed.digestTime)
        ? parsed.digestTime
        : base.digestTime,
    radiusIndex:
      typeof parsed.radiusIndex === "number" &&
      Number.isInteger(parsed.radiusIndex) &&
      parsed.radiusIndex >= 0 &&
      parsed.radiusIndex < RADIUS_OPTIONS.length
        ? parsed.radiusIndex
        : base.radiusIndex,
  };
}

/** Hydration-safe read — returns null on the server / before first render. */
function readPersisted(): NotificationSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!raw) return null;
    return mergeSettingsSnapshot(
      JSON.parse(raw) as Partial<NotificationSettings>,
    );
  } catch {
    return null;
  }
}

function persist(settings: NotificationSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(settings),
    );
    window.dispatchEvent(new CustomEvent(`${NOTIFICATION_SETTINGS_KEY}:sync`));
  } catch {
    // storage full / unavailable — hook state still drives this page
  }
}

export type UseNotificationSettingsResult = {
  settings: NotificationSettings;
  update: (patch: Partial<NotificationSettings>) => void;
  toggleRoute: (categoryKey: CategoryKey, channelKey: ChannelKey) => void;
  changeThreshold: (
    categoryKey: CategoryKey,
    threshold: SeverityThreshold,
  ) => void;
  resetMatrix: () => void;
};

export function useNotificationSettings(): UseNotificationSettingsResult {
  const [settings, setSettings] = useState<NotificationSettings>(
    createDefaultSettings,
  );

  // Apply persisted values exactly once, post-server-render, so there are
  // zero hydration mismatches.
  useEffect(() => {
    setSettings((prev) => readPersisted() ?? prev);
  }, []);

  // Persist on every settings change (also catches the hydration write).
  useEffect(() => {
    persist(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Keep other tabs honest via the shared `storage` event.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = () => setSettings((prev) => readPersisted() ?? prev);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleRoute = useCallback(
    (categoryKey: CategoryKey, channelKey: ChannelKey) => {
      setSettings((prev) => {
        const next = { ...prev.routes[categoryKey] };
        next[channelKey] = !next[channelKey];
        return {
          ...prev,
          routes: { ...prev.routes, [categoryKey]: next },
        };
      });
    },
    [],
  );

  const changeThreshold = useCallback(
    (categoryKey: CategoryKey, threshold: SeverityThreshold) => {
      setSettings((prev) => ({
        ...prev,
        thresholds: setThreshold(prev.thresholds, categoryKey, threshold),
      }));
    },
    [],
  );

  const resetMatrix = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      routes: initialRoutes(),
      thresholds: { ...DEFAULT_THRESHOLDS },
    }));
  }, []);

  const value = useMemo(
    () => ({ settings, update, toggleRoute, changeThreshold, resetMatrix }),
    [settings, update, toggleRoute, changeThreshold, resetMatrix],
  );

  return value;
}