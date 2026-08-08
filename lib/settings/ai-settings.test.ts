import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_AI_SETTINGS,
  DRIP_AI_SETTINGS_KEY,
  mergeAiSettings,
  readStoredAiSettings,
  writeStoredAiSettings,
} from "./ai-settings";

// ---------------------------------------------------------------------
// lib/settings/ai-settings.test.ts — AI Assistant (Phase 4 · Step 2).
//
// Verifies the merge/sanitize layer protecting the AI preferences shape,
// plus the localStorage round-trip used by ModelPreferencesCard.
// ---------------------------------------------------------------------

describe("mergeAiSettings", () => {
  it("returns shipped defaults for null / junk input", () => {
    expect(mergeAiSettings(null)).toEqual(DEFAULT_AI_SETTINGS);
    expect(mergeAiSettings("corrupt")).toEqual(DEFAULT_AI_SETTINGS);
    expect(mergeAiSettings(42)).toEqual(DEFAULT_AI_SETTINGS);
  });

  it("populates sane defaults so the UI is never blank on first load", () => {
    const fresh = mergeAiSettings(null);
    expect(fresh.provider).toBe("openai-gpt4o");
    expect(fresh.responseVerbosity).toBe("balanced");
    expect(fresh.personality).toBe("professional");
    expect(fresh.planExecutionMode).toBe("suggest");
    expect(fresh.memory.retention).toBe("1d");
    expect(fresh.toolAccess.modifyUserProfiles).toBe(false);
    expect(fresh.ragSources.ddmp).toBe(true);
    expect(fresh.feedbackLoop).toBe(false);
  });

  it("applies a valid snapshot verbatim", () => {
    const merged = mergeAiSettings({
      provider: "groq-llama3",
      apiKey: "gk_abc123",
      responseVerbosity: "detailed",
      personality: "urgent",
    });
    expect(merged.provider).toBe("groq-llama3");
    expect(merged.apiKey).toBe("gk_abc123");
    expect(merged.responseVerbosity).toBe("detailed");
    expect(merged.personality).toBe("urgent");
  });

  it("sanitizes the feedback-loop opt-in to boolean only", () => {
    const merged = mergeAiSettings({ feedbackLoop: true });
    expect(merged.feedbackLoop).toBe(true);
    const junk = mergeAiSettings({ feedbackLoop: "yes" });
    expect(junk.feedbackLoop).toBe(false); // default off (privacy-safe)
  });

  it("rejects unknown providers and falls back to the default", () => {
    const merged = mergeAiSettings({ provider: "deepseek-r2" });
    expect(merged.provider).toBe(DEFAULT_AI_SETTINGS.provider);
  });

  it("rejects unknown verbosity / personality values", () => {
    const merged = mergeAiSettings({
      responseVerbosity: "tweet-sized",
      personality: "sarcastic",
    });
    expect(merged.responseVerbosity).toBe(DEFAULT_AI_SETTINGS.responseVerbosity);
    expect(merged.personality).toBe(DEFAULT_AI_SETTINGS.personality);
  });

  it("per-tool guardrails apply only boolean values", () => {
    const merged = mergeAiSettings({
      toolAccess: {
        readFloodPredictions: false,
        queryShelterCapacity: "yes",
        modifyUserProfiles: true,
        bogus: true,
      },
    });

    expect(merged.toolAccess.readFloodPredictions).toBe(false);
    expect(merged.toolAccess.queryShelterCapacity).toBe(true); // invalid → default on
    expect(merged.toolAccess.modifyUserProfiles).toBe(true);
    expect(merged.toolAccess.accessResourceInventory).toBe(true); // default
    // The default gate for modifyUserProfiles is OFF.
    expect(mergeAiSettings({}).toolAccess.modifyUserProfiles).toBe(false);
  });

  it("accepts known plan execution modes and defaults to Suggest-Only", () => {
    expect(mergeAiSettings({ planExecutionMode: "auto" }).planExecutionMode).toBe("auto");
    expect(mergeAiSettings({ planExecutionMode: "disabled" }).planExecutionMode).toBe("disabled");
    expect(mergeAiSettings({}).planExecutionMode).toBe("suggest"); // org standard
    expect(mergeAiSettings({ planExecutionMode: "reckless" }).planExecutionMode).toBe("suggest");
  });

  it("sanitizes conversation memory settings", () => {
    const merged = mergeAiSettings({
      memory: { retention: "30d", autoArchiveResolved: false },
    });
    expect(merged.memory.retention).toBe("30d");
    expect(merged.memory.autoArchiveResolved).toBe(false);

    const junk = mergeAiSettings({ memory: { retention: "week", autoArchiveResolved: "yes" } });
    expect(junk.memory.retention).toBe("1d"); // invalid → default
    expect(junk.memory.autoArchiveResolved).toBe(true); // invalid → default
  });

  it("per-source RAG flags apply only boolean values", () => {
    const merged = mergeAiSettings({
      ragSources: { ndmaGuidelines: false, ddmp: "never", internationalProtocols: true },
    });
    expect(merged.ragSources.ndmaGuidelines).toBe(false);
    expect(merged.ragSources.ddmp).toBe(true); // invalid → default on
    expect(merged.ragSources.internationalProtocols).toBe(true);
    expect(merged.ragSources.stateSops).toBe(true); // default on
  });

  it("truncates dangerously long API keys", () => {
    const merged = mergeAiSettings({ apiKey: "x".repeat(2000) });
    expect(merged.apiKey.length).toBe(512);
  });
});

describe("localStorage round-trip", () => {
  afterEach(() => {
    (globalThis as { window?: unknown }).window = undefined;
  });

  it("writes then reads the AI snapshot unchanged", () => {
    const store = new Map<string, string | null>();
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => store.set(key, value),
      },
    };

    const snapshot = mergeAiSettings({ provider: "local-airgapped", apiKey: "local-run" });
    writeStoredAiSettings(snapshot);
    const restored = readStoredAiSettings();

    expect(restored).toEqual(snapshot);
    expect(store.has(DRIP_AI_SETTINGS_KEY)).toBe(true);
  });
});