// ---------------------------------------------------------------------
// lib/ai-bridge/ai-bridge.test.ts
// Unit tests for the Phase 1 AIBridge router: cloud-first routing when the
// backend heartbeat reports online, local-Gemma fallback when offline, and
// the guided offline notice when neither path can answer.
// ---------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIBridge } from "./ai-bridge";
import { ConnectivityMonitor } from "./connectivity";
import type { AIProvider, AIResponse, BridgeMode, ChatContext, ProviderStatus } from "./types";

function fakeProvider(overrides: {
  status?: ProviderStatus;
  text?: string;
  failCloud?: boolean;
  errorText?: string;
  mode?: BridgeMode;
}): AIProvider {
  return {
    getStatus: () => overrides.status ?? "online",
    estimateTokens: (t) => Math.ceil(t.length / 4),
    generateResponse: vi.fn(async (prompt: string): Promise<AIResponse> => ({
      text: overrides.failCloud
        ? (overrides.errorText ?? `cloud error: ${prompt}`)
        : (overrides.text ?? `answered: ${prompt}`),
      mode: overrides.failCloud ? "error" : (overrides.mode ?? "cloud"),
      durationMs: 1,
      error: overrides.failCloud,
    })),
  };
}

function stubMonitor(online: boolean): ConnectivityMonitor {
  const monitor = new ConnectivityMonitor();
  // Flip private snapshot state via the public update path.
  (monitor as unknown as { update(p: object): void }).update({
    browserOnline: online,
    backendReachable: online,
    online,
  });
  return monitor;
}

describe("AIBridge.route", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: true });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("routes to the cloud provider when online, returning its text", async () => {
    const cloud = fakeProvider({ status: "online", text: "cloud plan" });
    const bridge = new AIBridge({ cloud, local: fakeProvider({ status: "local-ready" }), monitor: stubMonitor(true) });

    const res: AIResponse = await bridge.route("Flood in Patna?");
    expect(res.mode).toBe("cloud");
    expect(res.text).toBe("cloud plan");
    expect(cloud.generateResponse).toHaveBeenCalledWith(
      "Flood in Patna?",
      expect.anything(),
    );
  });

  it("falls back to the local model when offline and it is ready", async () => {
    const local = fakeProvider({ status: "local-ready", text: "offline answer", mode: "local" });
    const bridge = new AIBridge({ cloud: fakeProvider({}), local, monitor: stubMonitor(false) });

    const res = await bridge.route("Evacuation route?");
    expect(res.mode).toBe("local");
    expect(res.text).toBe("offline answer");
  });

  it("returns the offline notice when offline and no local model is ready", async () => {
    const bridge = new AIBridge({
      cloud: fakeProvider({}),
      local: fakeProvider({ status: "local-unavailable" }),
      monitor: stubMonitor(false),
    });

    const res = await bridge.route("help");
    expect(res.mode).toBe("error");
    expect(res.error).toBe(true);
    expect(res.text).toContain("AI assistant is temporarily unavailable. For emergencies, use the SOS button or call 108.");
  });

  it("drops to the local model when cloud answers but errored online", async () => {
    const local = fakeProvider({ status: "local-ready", text: "stepped down", mode: "local" });
    const bridge = new AIBridge({
      cloud: fakeProvider({ status: "online", failCloud: true }),
      local,
      monitor: stubMonitor(true),
    });

    const res = await bridge.route("plan");
    expect(res.mode).toBe("local");
    expect(res.text).toBe("stepped down");
  });

  it("keeps the cloud error if local is not ready after a cloud failure", async () => {
    const bridge = new AIBridge({
      cloud: fakeProvider({ status: "online", failCloud: true, errorText: "cloud down" }),
      local: fakeProvider({ status: "local-unavailable" }),
      monitor: stubMonitor(true),
    });

    const res = await bridge.route("plan");
    expect(res.mode).toBe("error");
    expect(res.error).toBe(true);
    expect(res.text).toEqual("cloud down");
  });

  it("passes hidden context (district/provider) to the cloud provider", async () => {
    const cloud = fakeProvider({ status: "online" });
    const bridge = new AIBridge({ cloud, local: fakeProvider({}), monitor: stubMonitor(true) });
    const context: ChatContext = { currentDistrict: "Patna", provider: "groq-llama3", history: [{ role: "user", content: "earlier" }] };

    await bridge.route("What next?", context);
    expect(cloud.generateResponse).toHaveBeenCalledWith("What next?", context);
  });
});