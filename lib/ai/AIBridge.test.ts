// lib/ai/AIBridge.test.ts — hardware gate + bulletproof offline routing.

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkHardwareCapability,
  routeChatQuery,
  type HardwareCapability,
} from "@/lib/ai/AIBridge";
import { FALLBACK_DEFAULT_RESPONSE } from "@/lib/ai/FallbackEngine";
import type { AIResponse } from "@/lib/ai-bridge/types";

const realNavigator = globalThis.navigator;

function stubNavigator(value: Navigator | undefined) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value,
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: realNavigator,
  });
  vi.restoreAllMocks();
});

describe("checkHardwareCapability", () => {
  it("supports WebGPU + >= 4GB RAM", () => {
    stubNavigator({
      gpu: { requestAdapter: () => Promise.resolve(null) },
      deviceMemory: 8,
    } as unknown as Navigator);
    const cap = checkHardwareCapability();
    expect(cap.webgpu).toBe(true);
    expect(cap.memoryGb).toBe(8);
    expect(cap.supported).toBe(true);
  });

  it("rejects when RAM is under 4GB even with WebGPU", () => {
    stubNavigator({
      gpu: { requestAdapter: () => Promise.resolve(null) },
      deviceMemory: 2,
    } as unknown as Navigator);
    expect(checkHardwareCapability().supported).toBe(false);
  });

  it("rejects when WebGPU is missing even with 8GB RAM", () => {
    stubNavigator({ deviceMemory: 8 } as unknown as Navigator);
    const cap = checkHardwareCapability();
    expect(cap.webgpu).toBe(false);
    expect(cap.supported).toBe(false);
  });

  it("is SSR-safe (no navigator → unsupported)", () => {
    stubNavigator(undefined);
    expect(checkHardwareCapability()).toEqual({ webgpu: false, memoryGb: 0, supported: false });
  });
});

describe("routeChatQuery engine selection", () => {
  const weakCapability = (): HardwareCapability => ({ webgpu: false, memoryGb: 2, supported: false });
  const strongCapability = (): HardwareCapability => ({ webgpu: true, memoryGb: 8, supported: true });
  const shelterContext = () =>
    Promise.resolve([{ data: { name: "Patna City High School", distance: 1 } }]);

  it("goes cloud when online", async () => {
    const cloudRoute = vi.fn(
      async (): Promise<AIResponse> => ({
        text: "cloud answer",
        mode: "cloud",
        durationMs: 5,
      }),
    );
    const result = await routeChatQuery("what should I do?", "Patna", {
      isOnline: () => true,
      cloudRoute,
    });
    expect(result).toMatchObject({ text: "cloud answer", source: "cloud", engineUsed: "cloud" });
    expect(cloudRoute).toHaveBeenCalledOnce();
  });

  it("uses the offline logic engine when the device can't run WebLLM", async () => {
    const result = await routeChatQuery("where is the nearest shelter?", "Patna", {
      isOnline: () => false,
      capability: weakCapability,
      shelterContext,
    });
    expect(result.engineUsed).toBe("local-fallback");
    expect(result.source).toBe("local");
    expect(result.text).toContain("Patna City High School");
  });

  it("uses local-gemma when capable and the model answers", async () => {
    const localGenerate = vi.fn(
      async (): Promise<AIResponse> => ({ text: "gemma answer", mode: "local", durationMs: 40 }),
    );
    const result = await routeChatQuery("what should I do?", "Patna", {
      isOnline: () => false,
      capability: strongCapability,
      localGenerate,
      offlineContext: () => Promise.resolve("Patna cache summary"),
    });
    expect(result).toMatchObject({ text: "gemma answer", engineUsed: "local-gemma", source: "local" });
    expect(localGenerate).toHaveBeenCalledWith("what should I do?", "Patna cache summary");
  });

  it("steps down to the logic engine when local inference throws", async () => {
    const localGenerate = vi.fn(async () => {
      throw new Error("OOM");
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = await routeChatQuery("unmatched gibberish query", "Patna", {
      isOnline: () => false,
      capability: strongCapability,
      localGenerate,
      offlineContext: () => Promise.resolve("ctx"),
    });
    expect(result.engineUsed).toBe("local-fallback");
    expect(result.text).toBe(FALLBACK_DEFAULT_RESPONSE);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("steps down to the logic engine when the model returns an error payload", async () => {
    const localGenerate = vi.fn(
      async (): Promise<AIResponse> => ({ text: "not ready", mode: "local", durationMs: 1, error: true }),
    );
    const result = await routeChatQuery("hello", "Patna", {
      isOnline: () => false,
      capability: strongCapability,
      localGenerate,
      offlineContext: () => Promise.resolve("ctx"),
    });
    expect(result.engineUsed).toBe("local-fallback");
  });
});