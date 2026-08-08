"use client";

// ---------------------------------------------------------------------
// lib/privacy-settings-mock.ts — Privacy & Security (Phase 6 · Step 10).
//
// Centralized React hook for ALL privacy preferences built across
// Steps 2–9: data visibility, login/session timeouts, API keys, audit
// filters, retention policies, and account deactivation.
//
//   • usePrivacySettings() reads from a hydration-safe React context.
//   • Every change persists immediately to localStorage
//     ("drip_privacy_settings_v1") — no page refresh needed.
//   • Defaults are always populated (GPS visibility = Team, session
//     timeout = 30m, chat history = 30 days, …) so the UI is never blank
//     on first load.
//   • Cross-tab sync via the `storage` event keeps every open tab honest.
//   • A subtle, id-deduplicated success toast fires on every preference
//     change; pass { silent: true } for flows that already show their own
//     confirmation (e.g. the Danger Zone deactivation wizard).
//
// Mount <PrivacySettingsProvider> around any subtree that needs privacy
// prefs — PrivacySettingsWrapper does this for /settings/privacy.
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
  DRIP_PRIVACY_SETTINGS_KEY,
  mergePrivacySettings,
  readStoredPrivacySettings,
  writeStoredPrivacySettings,
  type PrivacySettings,
} from "@/lib/settings/privacy-settings";

const SAVED_TOAST_ID = "drip-privacy-settings-saved";

export type PrivacySettingsContextValue = {
  settings: PrivacySettings;
  /** Persist a partial update; fires a subtle toast unless silent. */
  update: (
    patch: Partial<PrivacySettings>,
    options?: { silent?: boolean },
  ) => void;
  /** Reset every privacy preference to the shipped defaults. */
  reset: () => void;
};

const PrivacySettingsContext = createContext<PrivacySettingsContextValue | null>(
  null,
);

export function PrivacySettingsProvider({ children }: { children: ReactNode }) {
  // Pure defaults on first render (server + client HTML identical), so the
  // page is fully populated before hydration — no hydration mismatch.
  const [settings, setSettings] = useState<PrivacySettings>(() =>
    mergePrivacySettings(null),
  );

  // Hydrate persisted values once after mount.
  useEffect(() => {
    setSettings((prev) => readStoredPrivacySettings() ?? prev);
  }, []);

  // Persist on every change (also captures the hydration snapshot).
  useEffect(() => {
    writeStoredPrivacySettings(settings);
  }, [settings]);

  // Cross-tab sync: edits in a second tab update this one live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRIP_PRIVACY_SETTINGS_KEY) return;
      try {
        if (!event.newValue) return;
        setSettings(mergePrivacySettings(JSON.parse(event.newValue)));
      } catch {
        // corrupt cross-tab write — ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback(
    (patch: Partial<PrivacySettings>, options?: { silent?: boolean }) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      // Instant tactile feedback for the demo — fires on every preference
      // change (visibility toggle, session timeout, retention dropdown…).
      if (!options?.silent) {
        toast("Privacy preferences updated", { id: SAVED_TOAST_ID });
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setSettings(mergePrivacySettings(null));
    toast("Privacy preferences reset to defaults.", { id: SAVED_TOAST_ID });
  }, []);

  const value = useMemo(
    () => ({ settings, update, reset }),
    [settings, update, reset],
  );

  return createElement(
    PrivacySettingsContext.Provider,
    { value },
    children,
  );
}

/** Read/write privacy preferences from any client component inside the provider. */
export function usePrivacySettings(): PrivacySettingsContextValue {
  const ctx = useContext(PrivacySettingsContext);
  if (!ctx) {
    throw new Error(
      "usePrivacySettings must be used inside <PrivacySettingsProvider>",
    );
  }
  return ctx;
}
