"use client";

// ---------------------------------------------------------------------
// lib/contacts-settings-mock.ts — Emergency Contacts (Phase 7 · Step 10).
//
// Centralized React hook for the contacts preferences built across
// Steps 4–7:
//   • Channel priority    — failover order of SMS / WhatsApp / Voice / Email
//   • GPS injection       — append-coordinates toggle + 60-min tracking
//   • Message templates   — the editable SOS template texts
//
//   • useContactSettings() reads from a hydration-safe React context.
//   • Every change persists immediately to localStorage
//     ("drip_contacts_settings_v1") — no page refresh needed.
//   • Defaults are always populated so the UI is never blank on first load.
//   • Cross-tab sync via the `storage` event keeps every open tab honest.
//
// Cards keep their own action toasts (reorder, toggle, save), so this
// hook persists silently — no toast here to avoid doubles.
//
// Mount <ContactSettingsProvider> around any subtree that needs contacts
// prefs — ContactsSettingsWrapper does this for /settings/contacts.
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
import {
  DRIP_CONTACTS_SETTINGS_KEY,
  cloneDefaultContactSettings,
  mergeContactSettings,
  readStoredContactSettings,
  writeStoredContactSettings,
  type ContactSettings,
} from "@/lib/settings/contacts-settings";

export type ContactSettingsContextValue = {
  settings: ContactSettings;
  /** Persist a partial update (silent — cards show their own toasts). */
  update: (patch: Partial<ContactSettings>) => void;
  /** Reset every contacts preference to the shipped defaults. */
  reset: () => void;
};

const ContactSettingsContext = createContext<ContactSettingsContextValue | null>(
  null,
);

export function ContactSettingsProvider({ children }: { children: ReactNode }) {
  // Pure defaults on first render (server + client HTML identical), so the
  // page is fully populated before hydration — no hydration mismatch.
  const [settings, setSettings] = useState<ContactSettings>(() =>
    cloneDefaultContactSettings(),
  );

  // Hydrate persisted values once after mount.
  useEffect(() => {
    setSettings((prev) => readStoredContactSettings() ?? prev);
  }, []);

  // Persist on every change (also captures the hydration snapshot).
  useEffect(() => {
    writeStoredContactSettings(settings);
  }, [settings]);

  // Cross-tab sync: edits in a second tab update this one live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRIP_CONTACTS_SETTINGS_KEY) return;
      try {
        if (!event.newValue) return;
        setSettings(mergeContactSettings(JSON.parse(event.newValue)));
      } catch {
        // corrupt cross-tab write — ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<ContactSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSettings(cloneDefaultContactSettings());
  }, []);

  const value = useMemo(
    () => ({ settings, update, reset }),
    [settings, update, reset],
  );

  return createElement(
    ContactSettingsContext.Provider,
    { value },
    children,
  );
}

/** Read/write contacts preferences from any client component inside the provider. */
export function useContactSettings(): ContactSettingsContextValue {
  const ctx = useContext(ContactSettingsContext);
  if (!ctx) {
    throw new Error(
      "useContactSettings must be used inside <ContactSettingsProvider>",
    );
  }
  return ctx;
}
