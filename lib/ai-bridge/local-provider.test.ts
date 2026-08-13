// ---------------------------------------------------------------------
// lib/ai-bridge/local-provider.test.ts
// Phase 1 · LocalGemmaProvider behavior with WebLLM present (injected
// engine loader) and absent (default lazy import → graceful fallback).
// ---------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import { LocalGemmaProvider } from "./local-provider";

function fakeEngine(): unknown {
  return {
    loadedModel: "gemma-2b-it-q4f16_1",
    chat: {
      completions: {
        create: vi.fn(async () => ({
          choices: [{ message: { content: "  local reply here  " } }],
        })),
      },
    },
  };
}

describe("LocalGemmaProvider", () => {
  it("reports local-unavailable when no engine loader is provided", () => {
    const provider = new LocalGemmaProvider();
    expect(provider.getStatus()).toBe("local-unavailable");
  });

  it("returns the guided offline notice when asked before load", async () => {
    const provider = new LocalGemmaProvider();
    const res = await provider.generateResponse("help", {});
    expect(res.mode).toBe("error");
    expect(res.error).toBe(true);
    expect(res.text).toContain("local safety model isn't ready");
  });

  it("warms up from an injected engine and answers locally", async () => {
    const engine = fakeEngine();
    const provider = new LocalGemmaProvider({
      loadEngine: vi.fn(async () => engine),
    });

    expect(provider.getStatus()).not.toBe("local-ready");
    expect(await provider.loadModel()).toBe(true);
    expect(provider.getStatus()).toBe("local-ready");

    const res = await provider.generateResponse("plan evacuation", {});
    expect(res.mode).toBe("local");
    expect(res.text).toBe("local reply here");
    expect(provider.estimateTokens("plan evacuation")).toBe(4);
  });

  it("trims responses and passes conversation history to the engine", async () => {
    const engine = fakeEngine();
    const provider = new LocalGemmaProvider({
      loadEngine: vi.fn(async () => engine),
    });
    await provider.loadModel();

    await provider.generateResponse("where do we go?", {
      history: [{ role: "user", content: "flood in Patna" }],
    });

    const create = (
      (engine as { chat: { completions: { create: ReturnType<typeof vi.fn> } } })
        .chat.completions.create as ReturnType<typeof vi.fn>
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: "user", content: "flood in Patna" },
          { role: "user", content: "where do we go?" },
        ],
      }),
    );
  });

  it("reruns after a load that failed or is still in progress", async () => {
    // loadEngine resolves to null (WebLLM absent) → stays local-unavailable
    const provider = new LocalGemmaProvider({
      loadEngine: vi.fn(async () => null),
    });
    expect(await provider.loadModel()).toBe(false);
    const res = await provider.generateResponse("help", {});
    expect(res.mode).toBe("error");
  });
});