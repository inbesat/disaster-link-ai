// ---------------------------------------------------------------------
// lib/offline-context/ab-test.ts — Offline-First Architecture · Phase 5
// A/B testing framework for the dual-mode AI: runs the SAME prompt through
// the cloud planner and the local model (with injected context) and scores
// both on the Phase 6 quality criteria — relevance to the provided context,
// concision, and whether it hallucinates by inventing data not in the
// briefing.
//
// The scorer is heuristic (length + "I don't have that information" honesty
// + context-anchored keywords). It's built for the judges' demo, not for
// production grading.
// ---------------------------------------------------------------------

import { buildAugmentedPrompt } from "./prompts";
import type { AIResponse } from "@/lib/ai-bridge/types";

export interface AbTestResult {
  prompt: string;
  context: string;
  cloud: ScoredReply;
  local: ScoredReply;
  verdict: "cloud" | "local" | "tie";
  testedAt: number;
}

export interface ScoredReply {
  mode: "cloud" | "local";
  text: string;
  durationMs: number;
  error: boolean;
  scores: { relevance: number; concision: number; honesty: number; total: number };
}

/** Keywords that should appear when the answer actually uses the briefing. */
const CONTEXT_KEYWORDS = ["flood", "risk", "alert", "shelter", "evacuat", "km", "rain", "weather"];

/** Long-ish, rambling answers lose concision points. */
const IDEAL_CHARS = 500;

export function scoreReply(text: string): ScoredReply["scores"] {
  const lower = text.toLowerCase();
  const charCount = text.length;

  const keywordHits = CONTEXT_KEYWORDS.filter((k) => lower.includes(k)).length;
  const relevance = Math.min(1, keywordHits / 3);

  const concision = charCount === 0 ? 0 : Math.max(0, 1 - Math.max(0, charCount - IDEAL_CHARS) / IDEAL_CHARS);

  // Honesty: admitting missing data scores high for safety models.
  const honesty =
    lower.includes("don't have") || lower.includes("do not have") || lower.includes("not in my")
      ? 1
      : 0.4;

  const total = (relevance * 0.4 + concision * 0.3 + honesty * 0.3) * 10;
  return { relevance, concision, honesty, total: Math.round(total * 100) / 100 };
}

export interface AbTestDeps {
  /** Runs the cloud path. */
  cloudFn: (prompt: string) => Promise<AIResponse>;
  /** Runs the local path with the augmented (context-injected) prompt. */
  localFn: (augmentedPrompt: string) => Promise<AIResponse>;
}

/**
 * Runs the cloud/local comparison. The local model always receives the
 * context-augmented prompt; the cloud path gets the raw question (it has
 * its own server-side RAG). Returns scored results + a verdict.
 */
export async function runAbTest(
  question: string,
  context: string,
  deps: AbTestDeps,
): Promise<AbTestResult> {
  const augmented = buildAugmentedPrompt(question, context);

  const [cloudRes, localRes] = await Promise.all([
    deps.cloudFn(question),
    deps.localFn(augmented),
  ]);

  const cloud: ScoredReply = {
    mode: "cloud",
    text: cloudRes.text,
    durationMs: cloudRes.durationMs,
    error: !!cloudRes.error,
    scores: scoreReply(cloudRes.text),
  };
  const local: ScoredReply = {
    mode: "local",
    text: localRes.text,
    durationMs: localRes.durationMs,
    error: !!localRes.error,
    scores: scoreReply(localRes.text),
  };

  const verdict: AbTestResult["verdict"] =
    cloud.error && !local.error
      ? "local"
      : !cloud.error && local.error
        ? "cloud"
        : cloud.error && local.error
          ? "tie"
          : cloud.scores.total === local.scores.total
            ? "tie"
            : cloud.scores.total > local.scores.total
              ? "cloud"
              : "local";

  return {
    prompt: question,
    context: augmented,
    cloud,
    local,
    verdict,
    testedAt: Date.now(),
  };
}
