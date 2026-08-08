"use client";

// ---------------------------------------------------------------------
// lib/integrations-settings-mock.ts — Integrations (Phase 8 · Step 10).
//
// Centralized React hook for the Integrations page state: weather API
// keys, failover priority, outgoing webhooks and monthly quotas.
//
//   • useIntegrationSettings() reads from a hydration-safe context.
//   • Every change persists immediately to localStorage
//     ("drip_integrations_settings_v1") — no page refresh needed, so the
//     demo survives a reload.
//   • Defaults are always populated (Slack + State Gov webhooks, Twilio /
//     OpenRouter quotas, bill-shock protection ON) so the UI is never
//     blank on first load.
//   • Cross-tab sync via the `storage` event keeps every open tab honest.
//   • Action toasts: add/remove webhook, bill-shock toggle and reset fire
//     satisfying confirmations; keystroke-level actions (typing API keys,
//     dragging failover order, recording a ping) stay silent because the
//     cards already show their own feedback.
//
// Mount <IntegrationsSettingsProvider> around the Integrations page —
// IntegrationsWrapper does this for /settings/integrations.
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
  DRIP_INTEGRATIONS_SETTINGS_KEY,
  cloneDefaultIntegrationsSettings,
  mergeIntegrationsSettings,
  readStoredIntegrationsSettings,
  writeStoredIntegrationsSettings,
  type IntegrationWebhook,
  type IntegrationsSettings,
  type WeatherProviderId,
} from "@/lib/settings/integrations-settings";

const SAVED_TOAST_ID = "drip-integrations-settings-saved";

export type IntegrationsSettingsContextValue = {
  settings: IntegrationsSettings;
  /** Persist one weather provider's API key (silent — text input). */
  setWeatherApiKey: (provider: WeatherProviderId, value: string) => void;
  /** Persist the failover order (silent — the card shows its own toast). */
  setWeatherPriority: (priority: WeatherProviderId[]) => void;
  /** Add an outgoing webhook; fires a success toast. */
  addWebhook: (hook: Omit<IntegrationWebhook, "id">) => void;
  /** Remove an outgoing webhook; fires a success toast. */
  removeWebhook: (id: string, name: string) => void;
  /** Record a successful test ping (silent — the ping already toasts). */
  markWebhookPinged: (id: string) => void;
  /** Toggle bill-shock auto-disable; fires a success toast. */
  setAutoDisable: (enabled: boolean) => void;
  /** Reset every integration setting to the shipped defaults. */
  reset: () => void;
};

const IntegrationsSettingsContext =
  createContext<IntegrationsSettingsContextValue | null>(null);

let webhookIdCounter = 0;

function nextWebhookId(): string {
  webhookIdCounter += 1;
  return `wh-${Date.now().toString(36)}-${webhookIdCounter}`;
}

export function IntegrationsSettingsProvider({ children }: { children: ReactNode }) {
  // Pure defaults on first render (server + client HTML identical), so the
  // page is fully populated before hydration — no hydration mismatch.
  const [settings, setSettings] = useState<IntegrationsSettings>(
    cloneDefaultIntegrationsSettings,
  );

  // Hydrate persisted values once after mount.
  useEffect(() => {
    setSettings((prev) => readStoredIntegrationsSettings() ?? prev);
  }, []);

  // Persist on every change (also captures the hydration snapshot).
  useEffect(() => {
    writeStoredIntegrationsSettings(settings);
  }, [settings]);

  // Cross-tab sync: edits in a second tab update this one live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRIP_INTEGRATIONS_SETTINGS_KEY) return;
      try {
        if (!event.newValue) return;
        setSettings(mergeIntegrationsSettings(JSON.parse(event.newValue)));
      } catch {
        // corrupt cross-tab write — ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toastSaved = useCallback((message: string) => {
    toast.success(message, { id: SAVED_TOAST_ID });
  }, []);

  const setWeatherApiKey = useCallback(
    (provider: WeatherProviderId, value: string) => {
      setSettings((prev) => ({
        ...prev,
        weatherApiKeys: { ...prev.weatherApiKeys, [provider]: value },
      }));
    },
    [],
  );

  const setWeatherPriority = useCallback((priority: WeatherProviderId[]) => {
    setSettings((prev) => ({ ...prev, weatherPriority: priority }));
  }, []);

  const addWebhook = useCallback(
    (hook: Omit<IntegrationWebhook, "id">) => {
      const webhook: IntegrationWebhook = { ...hook, id: nextWebhookId() };
      setSettings((prev) => ({
        ...prev,
        webhooks: [...prev.webhooks, webhook],
      }));
      toastSaved(
        `Webhook "${hook.name}" added — ${hook.triggers.length} trigger(s) armed.`,
      );
    },
    [toastSaved],
  );

  const removeWebhook = useCallback(
    (id: string, name: string) => {
      setSettings((prev) => ({
        ...prev,
        webhooks: prev.webhooks.filter((w) => w.id !== id),
      }));
      toastSaved(`Webhook "${name}" removed.`);
    },
    [toastSaved],
  );

  const markWebhookPinged = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      webhooks: prev.webhooks.map((w) =>
        w.id === id ? { ...w, lastPing: "just now" } : w,
      ),
    }));
  }, []);

  const setAutoDisable = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({
        ...prev,
        quotas: { ...prev.quotas, autoDisable: enabled },
      }));
      toastSaved(
        enabled
          ? "Bill Shock Protection on — services auto-pause at 95% quota."
          : "Bill Shock Protection off — services run until quota runs out.",
      );
    },
    [toastSaved],
  );

  const reset = useCallback(() => {
    setSettings(cloneDefaultIntegrationsSettings());
    toastSaved("Integration settings reset to defaults.");
  }, [toastSaved]);

  const value = useMemo<IntegrationsSettingsContextValue>(
    () => ({
      settings,
      setWeatherApiKey,
      setWeatherPriority,
      addWebhook,
      removeWebhook,
      markWebhookPinged,
      setAutoDisable,
      reset,
    }),
    [
      settings,
      setWeatherApiKey,
      setWeatherPriority,
      addWebhook,
      removeWebhook,
      markWebhookPinged,
      setAutoDisable,
      reset,
    ],
  );

  return createElement(
    IntegrationsSettingsContext.Provider,
    { value },
    children,
  );
}

/** Read/write Integrations state from any card inside the provider. */
export function useIntegrationSettings(): IntegrationsSettingsContextValue {
  const ctx = useContext(IntegrationsSettingsContext);
  if (!ctx) {
    throw new Error(
      "useIntegrationSettings must be used inside <IntegrationsSettingsProvider>",
    );
  }
  return ctx;
}
