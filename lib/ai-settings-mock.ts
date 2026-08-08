"use client";

// ---------------------------------------------------------------------
// lib/ai-settings-mock.ts — AI Assistant & LLM Preferences (Phase 4 · Step 9).
//
// Centralized React hook for ALL AI preferences built across Steps 2–8:
// provider, API key, response verbosity, personality, tool access, plan
// approval mode, memory/retention, RAG sources and the feedback loop.
//
//   • useAiSettings() reads from a hydration-safe React context.
//   • Every change persists immediately to localStorage
//     ("drip_ai_settings_v1") — no page refresh needed.
//   • Defaults are always populated (Verbosity = Balanced, Approval =
//     Suggest-Only, ...) so the UI is never blank on first load.
//
// Mount <AiSettingsProvider> around any subtree that needs AI prefs — the
// AiSettingsWrapper does this for /settings/ai.
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
  DRIP_AI_SETTINGS_KEY,
  cloneDefaultAiSettings,
  mergeAiSettings,
  readStoredAiSettings,
  writeStoredAiSettings,
  type AiSettings,
} from "@/lib/settings/ai-settings";

const SAVED_TOAST_ID = "drip-ai-settings-saved";

export type AiSettingsContextValue = {
  settings: AiSettings;
  update: (patch: Partial<AiSettings>) => void;
  reset: () => void;
};

const AiSettingsContext = createContext<AiSettingsContextValue | null>(null);

export function AiSettingsProvider({ children }: { children: ReactNode }) {
  // Pure defaults on first render (server + client HTML identical), so the
  // page is fully populated before hydration.
  const [settings, setSettings] = useState<AiSettings>(cloneDefaultAiSettings);

  // Hydrate persisted values once after mount — no hydration mismatch.
  useEffect(() => {
    setSettings((prev) => readStoredAiSettings() ?? prev);
  }, []);

  // Persist on every change (also captures the hydration snapshot).
  useEffect(() => {
    writeStoredAiSettings(settings);
  }, [settings]);

  // Cross-tab sync: edits in a second tab update this one live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRIP_AI_SETTINGS_KEY) return;
      try {
        if (!event.newValue) return;
        setSettings(mergeAiSettings(JSON.parse(event.newValue)));
      } catch {
        // corrupt cross-tab write — ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<AiSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    // Instant tactile feedback for the demo — fires on every preference
    // change (tool toggles, verbosity slider, approval mode, retention…).
    toast("AI parameters updated", { id: SAVED_TOAST_ID });
  }, []);

  const reset = useCallback(() => {
    setSettings(cloneDefaultAiSettings());
    toast("AI parameters reset to defaults.", { id: SAVED_TOAST_ID });
  }, []);

  const value = useMemo(
    () => ({ settings, update, reset }),
    [settings, update, reset],
  );

  return createElement(
    AiSettingsContext.Provider,
    { value },
    children,
  );
}

/** Read/write the AI preferences from any client component inside the provider. */
export function useAiSettings(): AiSettingsContextValue {
  const ctx = useContext(AiSettingsContext);
  if (!ctx) {
    throw new Error("useAiSettings must be used inside <AiSettingsProvider>");
  }
  return ctx;
}