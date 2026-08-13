// ---------------------------------------------------------------------
// lib/ai-bridge/webllm-provider.test.ts
// Phase 4 · WebLLMProvider: initialize(onProgress) streaming progress,
// disaster system prompt, history passing, and graceful unavailability
// when the engine loader resolves null.
// ---------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import {
  DISASTER_SYSTEM_PROMPT,
  DEFAULT_WEBLLM_MODEL,
  WebLLMProvider,
  type WebLlmEngineLike,
} from "./webllm-provider";

function fakeEngine(): WebLlmEngineLike {
  return {
    loadedModel: DEFAULT_WEBLLM_MODEL,
    chat: {
      completions: {
        create: vi.fn(async () => ({
          choices: [{ message: { content: "  evac east via NH-31  " } }],
        })),
      },
    },
  };
}

describe("WebLLMProvider", () => {
  it("is not loaded by default", () => {
    const p = new WebLLMProvider();
    expect(p.isModelLoaded()).toBe(false);
    expect(p.getStatus()).toBe("local-unavailable");
  });

  it("initialize() streams progress and returns true on success", async () => {
    const progress: number[] = [];
    const p = new WebLLMProvider({
      loadEngine: vi.fn(async (_, onProgress) => {
        onProgress(0.3);
        onProgress(0.7);
        return fakeEngine();
      }),
    });
    const ok = await p.initialize((f) => progress.push(f));
    expect(ok).toBe(true);
    expect(progress).toContain(0.3);
    expect(progress).toContain(0.7);
    expect(p.isModelLoaded()).toBe(true);
    expect(p.getStatus()).toBe("local-ready");
    expect(p.lastDownloadProgress).toBe(0.7);
  });

  it("returns false when the engine fails to load", async () => {
    const p = new WebLLMProvider({
      loadEngine: vi.fn(async () => null),
    });
    const ok = await p.initialize(() => {});
    expect(ok).toBe(false);
    expect(p.getStatus()).toBe("local-unavailable");
  });

  it("prepends the disaster system prompt and passes history", async () => {
    const engine = fakeEngine();
    const p = new WebLLMProvider({
      loadEngine: vi.fn(async () => engine),
    });
    await p.loadModel();

    const res = await p.generateResponse("what route?", {
      history: [{ role: "user", content: "flood in Patna" }],
    });
    expect(res.mode).toBe("local");
    expect(res.text).toBe("evac east via NH-31");

    const create = (
      (engine.chat!.completions!.create as unknown) as ReturnType<typeof vi.fn>
    );
    expect(create).toHaveBeenCalledWith({
      messages: [
        { role: "system", content: DISASTER_SYSTEM_PROMPT },
        { role: "user", content: "flood in Patna" },
        { role: "user", content: "what route?" },
      ],
      temperature: 0.4,
    });
  });

  it("returns the guided not-ready reply before any load", async () => {
    const p = new WebLLMProvider();
    const res = await p.generateResponse("help", {});
    expect(res.mode).toBe("error");
    expect(res.error).toBe(true);
    expect(res.text).toContain("isn't ready");
  });

  it("retries after a load that is still in flight", async () => {
    const engine = fakeEngine();
    const p = new WebLLMProvider({
      loadEngine: vi.fn(async () => engine),
    });
    // Kick off the load, then ask before it resolves.
    const init = p.initialize(() => {});
    const res = await p.generateResponse("plan", {});
    await init;
    expect(res.mode).toBe("local");
  });

  it("estimateTokens delegates to the shared estimator", () => {
    const p = new WebLLMProvider({ engineAvailable: true });
    expect(p.estimateTokens("Hello world")).toBe(3);
  });
});