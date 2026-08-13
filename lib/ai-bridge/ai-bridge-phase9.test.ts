// ---------------------------------------------------------------------
// lib/ai-bridge/ai-bridge-phase9.test.ts — Phase 9 resilience integration
// ---------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIBridge } from "./ai-bridge";
import { ConnectivityMonitor } from "./connectivity";
import { RuleBasedFallback } from "./rule-based-fallback";
import type { AIProvider, AIResponse, BridgeMode, ProviderStatus } from "./types";

function fakeProvider(overrides: {
  status?: ProviderStatus;
  text?: string;
  mode?: BridgeMode;
  error?: boolean;
  confidence?: number;
}): AIProvider {
  return {
    getStatus: () => overrides.status ?? "online",
    estimateTokens: (t) => Math.ceil(t.length / 4),
    generateResponse: vi.fn(async (prompt: string): Promise<AIResponse> => ({
      text: overrides.text ?? `answered: ${prompt}`,
      mode: overrides.mode ?? "cloud",
      durationMs: 1,
      error: overrides.error ?? (overrides.mode === "error"),
      confidence: overrides.confidence,
    })),
  };
}

function stubMonitor(online: boolean): ConnectivityMonitor {
  const monitor = new ConnectivityMonitor();
  (monitor as unknown as { update(p: object): void }).update({
    browserOnline: online,
    backendReachable: online,
    online,
  });
  return monitor;
}

describe("AIBridge phase-9 fallback", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: false });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("answers from the rule-based robot when offline and no local model exists", async () => {
    const bridge = new AIBridge({
      cloud: fakeProvider({}),
      local: fakeProvider({ status: "local-unavailable" }),
      monitor: stubMonitor(false),
      fallback: new RuleBasedFallback(),
    });

    const res = await bridge.route("flood what should i do");
    expect(res.mode).toBe("local");
    expect(res.source).toBe("rule-based");
    expect(res.text).toContain("highest ground");
  });

  it("keeps the guided offline notice when the fallback itself errors", async () => {
    const failingFallback: AIProvider = {
      getStatus: () => "local-ready",
      estimateTokens: () => 1,
      generateResponse: async () => {
        throw new Error("fallback broken");
      },
    };
    const bridge = new AIBridge({
      cloud: fakeProvider({}),
      local: fakeProvider({ status: "local-unavailable" }),
      monitor: stubMonitor(false),
      fallback: failingFallback,
    });

    const res = await bridge.route("anything");
    expect(res.mode).toBe("error");
    expect(res.error).toBe(true);
    expect(res.text).toContain("local safety model isn't ready");
  });

  it("does not consult the fallback when the local model answers", async () => {
    const local = fakeProvider({ status: "local-ready", text: "gemma answer", mode: "local", confidence: 0.8 });
    const fallbackSpy = new RuleBasedFallback();
    const spy = vi.spyOn(fallbackSpy, "generateResponse");
    const bridge = new AIBridge({
      cloud: fakeProvider({}),
      local,
      monitor: stubMonitor(false),
      fallback: fallbackSpy,
    });

    const res = await bridge.route("question");
    expect(res.text).toBe("gemma answer");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("AIBridge phase-9 confidence guard", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: false });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("replaces low-confidence local output when the guard is enabled", async () => {
    const lowConfidenceLocal = fakeProvider({
      status: "local-ready",
      text: "sorry i don't know as an ai model",
      mode: "local",
      confidence: 0.1,
    });
    const bridge = new AIBridge({
      cloud: fakeProvider({}),
      local: lowConfidenceLocal,
      monitor: stubMonitor(false),
      guardConfidence: true,
    });

    const res = await bridge.route("help");
    expect(res.source).toBe("confidence-guard");
    expect(res.text).toContain("general safety advice");
    expect(res.confidence).toBeLessThan(0.6);
  });

  it("scores a response that lacks a model-provided confidence", async () => {
    const plainLocal = fakeProvider({
      status: "local-ready",
      text: "Call the helpline 112. Move to high ground immediately, evacuate to the nearest shelter and keep your radio and emergency kit ready. Do not walk through floodwater.",
      mode: "local",
      confidence: undefined,
    });
    const bridge = new AIBridge({
      cloud: fakeProvider({}),
      local: plainLocal,
      monitor: stubMonitor(false),
      guardConfidence: true,
    });

    const res = await bridge.route("help");
    expect(res.text).toContain("Move to high ground");
    expect(res.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it("passes through without scoring when the guard is disabled", async () => {
    const local = fakeProvider({
      status: "local-ready",
      text: "sorry I can't say",
      mode: "local",
    });
    const bridge = new AIBridge({
      cloud: fakeProvider({}),
      local,
      monitor: stubMonitor(false),
      guardConfidence: false,
    });

    const res = await bridge.route("help");
    expect(res.text).toBe("sorry I can't say");
    expect(res.confidence).toBeUndefined();
  });
});