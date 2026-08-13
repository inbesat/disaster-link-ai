// ---------------------------------------------------------------------
// lib/offline-context/ab-test.test.ts — Phase 5 A/B framework for the
// cloud-vs-local scoring used in the judges' demo.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { runAbTest, scoreReply, type AbTestDeps } from "./ab-test";
import type { AIResponse } from "@/lib/ai-bridge/types";

const context = "=== CURRENT SITUATION\nFlood Risk: High. Alert: evacuate now.";

function reply(text: string, opts: Partial<AIResponse> = {}): AIResponse {
  return { text, mode: "cloud", durationMs: 100, ...opts };
}

function deps(cloud: AIResponse, local: AIResponse): AbTestDeps {
  return {
    cloudFn: async () => cloud,
    localFn: async () => local,
  };
}

describe("scoreReply", () => {
  it("scores a context-anchored concise answer higher than rambling", () => {
    const good = scoreReply("Flood risk is high. Evacuate to the shelter now.");
    const ramble = scoreReply(
      "well, so, you see, the flood risk might be high and also the shelter " +
        "is near and you could maybe evacuate and also please be careful ".repeat(10),
    );
    expect(good.total).toBeGreaterThan(ramble.total);
  });

  it("rewards honesty when data is missing", () => {
    const honest = scoreReply("I don't have that information in my cached data.");
    expect(honest.honesty).toBe(1);
    expect(honest.total).toBeGreaterThanOrEqual(5);
  });
});

describe("runAbTest", () => {
  it("prefers local when cloud errors", async () => {
    const result = await runAbTest(
      "Is it safe to leave?",
      context,
      deps(reply("", { error: true, mode: "error" }), reply("Flood risk is high. Stay safe.")),
    );
    expect(result.verdict).toBe("local");
    expect(result.cloud.error).toBe(true);
    expect(result.local.error).toBe(false);
  });

  it("prefers cloud when local errors", async () => {
    const result = await runAbTest(
      "Is it safe to leave?",
      context,
      deps(reply("High risk. Evacuate."), reply("", { error: true, mode: "error" })),
    );
    expect(result.verdict).toBe("cloud");
  });

  it("picks the higher-scoring side and ties cleanly", async () => {
    const same = await runAbTest(
      "Is it safe to leave?",
      context,
      deps(reply("Flood risk high. Evacuate now."), reply("Flood risk high. Evacuate now.")),
    );
    expect(same.verdict).toBe("tie");
  });

  it("injects context into the local prompt only", async () => {
    let localPrompt = "";
    await runAbTest("Any alerts?", context, {
      cloudFn: async (q) => reply(`got:${q}`),
      localFn: async (p) => {
        localPrompt = p;
        return reply("ok");
      },
    });
    expect(localPrompt).toContain("CURRENT SITUATION");
    expect(localPrompt).toContain("User Question: Any alerts?");
  });
});