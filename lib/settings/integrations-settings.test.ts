import { afterEach, describe, expect, it } from "vitest";
import {
  cloneDefaultIntegrationsSettings,
  DEFAULT_INTEGRATIONS_SETTINGS,
  mergeIntegrationsSettings,
  readStoredIntegrationsSettings,
  writeStoredIntegrationsSettings,
} from "./integrations-settings";

// ---------------------------------------------------------------------
// lib/settings/integrations-settings.test.ts — Integrations (Phase 8 · Step 10).
//
// Verifies the merge/sanitize layer protecting the Integrations snapshot
// (weather API keys, failover priority, outgoing webhooks, monthly
// quotas) and the localStorage round-trip used by the Phase 8 cards.
// ---------------------------------------------------------------------

describe("defaults", () => {
  it("seeds webhooks, quotas and bill-shock protection for first load", () => {
    const fresh = mergeIntegrationsSettings(null);
    // Slack + State Gov webhooks from Step 5.
    expect(fresh.webhooks).toHaveLength(2);
    expect(fresh.webhooks[0].name).toBe("Slack Command Center Channel");
    expect(fresh.webhooks[1].name).toBe("State Gov Portal");
    // Twilio 850/1000 + OpenRouter 120k/500k from Step 8.
    expect(fresh.quotas.usage).toEqual([
      { id: "twilio", used: 850, limit: 1000 },
      { id: "openrouter", used: 120_000, limit: 500_000 },
    ]);
    // Bill-shock protection is ON by default.
    expect(fresh.quotas.autoDisable).toBe(true);
    expect(fresh.weatherPriority).toEqual(["imd", "openweather", "glofas"]);
  });

  it("returns shipped defaults for junk input", () => {
    expect(mergeIntegrationsSettings("corrupt")).toEqual(
      mergeIntegrationsSettings(null),
    );
    expect(mergeIntegrationsSettings(42).webhooks).toHaveLength(2);
    expect(mergeIntegrationsSettings(undefined).quotas.autoDisable).toBe(true);
  });

  it("clone deep-copies so callers can never mutate the shipped defaults", () => {
    const a = cloneDefaultIntegrationsSettings();
    a.webhooks[0].triggers.push("resource");
    a.quotas.usage[0].used = 1;
    expect(DEFAULT_INTEGRATIONS_SETTINGS.webhooks[0].triggers).toEqual([
      "alert",
      "plan",
    ]);
    expect(DEFAULT_INTEGRATIONS_SETTINGS.quotas.usage[0].used).toBe(850);
  });
});

describe("mergeIntegrationsSettings", () => {
  it("preserves weather API keys and ignores junk values", () => {
    const merged = mergeIntegrationsSettings({
      weatherApiKeys: { imd: "imd_live_1", openweather: "owm_2", glofas: 42 },
    });
    expect(merged.weatherApiKeys.imd).toBe("imd_live_1");
    expect(merged.weatherApiKeys.openweather).toBe("owm_2");
    // non-string junk → empty
    expect(merged.weatherApiKeys.glofas).toBe("");
  });

  it("accepts a full failover permutation but falls back on missing ids", () => {
    const reordered = mergeIntegrationsSettings({
      weatherPriority: ["glofas", "imd", "openweather"],
    });
    expect(reordered.weatherPriority).toEqual(["glofas", "imd", "openweather"]);

    const dupes = mergeIntegrationsSettings({
      weatherPriority: ["imd", "imd", "openweather", "glofas"],
    });
    expect(dupes.weatherPriority).toEqual(["imd", "openweather", "glofas"]);

    const missing = mergeIntegrationsSettings({
      weatherPriority: ["imd", "glofas"],
    });
    expect(missing.weatherPriority).toEqual(["imd", "openweather", "glofas"]);
  });

  it("drops malformed webhooks but keeps a valid one", () => {
    const merged = mergeIntegrationsSettings({
      webhooks: [
        { id: "w1", name: "Valid Hook", endpoint: "https://x.in/h", secret: "s", triggers: ["alert"], lastPing: null },
        { name: "no id" },
        "junk",
      ],
    });
    expect(merged.webhooks).toHaveLength(1);
    expect(merged.webhooks[0].id).toBe("w1");
    // unknown triggers are stripped
    expect(merged.webhooks[0].triggers).toEqual(["alert"]);
  });

  it("an explicitly empty webhook array stays empty (removals persist)", () => {
    const merged = mergeIntegrationsSettings({ webhooks: [] });
    expect(merged.webhooks).toEqual([]);
  });

  it("sanitizes quota usage numbers and dedupes ids", () => {
    const merged = mergeIntegrationsSettings({
      quotas: {
        autoDisable: false,
        usage: [
          { id: "twilio", used: -50, limit: 1000 },
          { id: "openrouter", used: 120.7, limit: "lots" },
          { id: "openrouter", used: 999, limit: 1000 },
        ],
      },
    });
    expect(merged.quotas.autoDisable).toBe(false);
    // negative used clamped to 0
    expect(merged.quotas.usage[0]).toEqual({ id: "twilio", used: 0, limit: 1000 });
    // fractional rounded; junk limit → 1
    expect(merged.quotas.usage[1]).toEqual({ id: "openrouter", used: 121, limit: 1 });
    // duplicate id dropped
    expect(merged.quotas.usage).toHaveLength(2);
  });

  it("keeps the shipped quota defaults when usage is absent", () => {
    const merged = mergeIntegrationsSettings({ quotas: { autoDisable: false } });
    expect(merged.quotas.usage).toEqual(DEFAULT_INTEGRATIONS_SETTINGS.quotas.usage);
  });
});

describe("localStorage round-trip", () => {
  afterEach(() => {
    (globalThis as { window?: unknown }).window = undefined;
  });

  it("writes then reads the Integrations snapshot unchanged", () => {
    const store = new Map<string, string | null>();
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => store.set(key, value),
      },
    };

    const snapshot = mergeIntegrationsSettings({
      weatherApiKeys: { imd: "imd_live_x", openweather: "", glofas: "" },
      weatherPriority: ["glofas", "openweather", "imd"],
      webhooks: [
        {
          id: "w-custom",
          name: "Custom Portal",
          endpoint: "https://custom.in/h",
          secret: "whsec_custom",
          triggers: ["alert", "resource"],
          lastPing: "just now",
        },
      ],
      quotas: { autoDisable: false, usage: [{ id: "twilio", used: 5, limit: 10 }] },
    });
    writeStoredIntegrationsSettings(snapshot);
    const restored = readStoredIntegrationsSettings();

    expect(restored).toEqual(snapshot);
    expect(restored!.weatherPriority).toEqual(["glofas", "openweather", "imd"]);
    expect(restored!.webhooks[0].name).toBe("Custom Portal");
    expect(restored!.quotas.autoDisable).toBe(false);
  });
});
