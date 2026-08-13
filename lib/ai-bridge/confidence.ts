// ---------------------------------------------------------------------
// lib/ai-bridge/confidence.ts — Offline-First Architecture · Phase 9
// Confidence scoring for local AI responses.
//
// When the Gemma model loads but produces garbage (repeated tokens,
// hallucinated gibberish, no actionable content), the bridge should not
// present it as a real answer. scoreResponseConfidence() inspects the raw
// output and returns a 0..1 score; anything below LOW_CONFIDENCE_THRESHOLD
// triggers a graceful hand-off instead of the garbage text.
//
//   const score = scoreResponseConfidence(localText);
//   if (score < LOW_CONFIDENCE_THRESHOLD) return lowConfidenceReply();
//
// Pure + deterministic, so tests can pin exact scores for representative
// good and bad outputs.
// ---------------------------------------------------------------------

/** Below this score an answer is treated as untrustworthy (spec: 0.6). */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

/**
 * The guided reply shown when local AI output fails scoring. Includes the
 * general advice link so the citizen is never left with nothing.
 */
export const LOW_CONFIDENCE_REPLY =
  "I'm not sure I understood that correctly. Here's general safety advice: move to safe ground, keep your emergency kit ready, and stay tuned to official alerts. For a precise answer, reconnect to the internet or call the emergency helpline 112.";

export const GENERAL_ADVICE_LINK = "/public/alerts";

/** Phrases that strongly indicate a real, grounded answer. */
const POSITIVE_MARKERS = [
  "call",
  "helpline",
  "step",
  "evacuate",
  "high ground",
  "shelter",
  "radio",
  "safe",
  "don't",
  "do not",
  "water",
  "emergency",
  "first aid",
  "torch",
  "go-bag",
  "phone",
];

/** Phrases that suggest the model is unsure or producing boilerplate. */
const NEGATIVE_MARKERS = [
  "i'm not sure",
  "i am not sure",
  "i don't know",
  "i do not know",
  "sorry",
  "as an ai",
  "as a language model",
  "cannot provide",
  "unable to",
  "n/a",
  "undefined",
  "lorem",
  "gibberish",
  "placeholder",
];

/** Signs of degenerate / repeated-token output (garbage). */
const REPETITION_RE = /(\S+ \S+ \S+)( \1){2,}/;

/**
 * Scores a model response between 0 and 1. Higher is more trustworthy.
 * Heuristic, not probabilistic — designed to catch the failure modes the
 * local model actually exhibits (repetition, hedging, boilerplate).
 */
export function scoreResponseConfidence(text: string): number {
  const normalized = (text ?? "").toLowerCase().trim();
  if (!normalized) return 0;

  let score = 0.4; // neutral baseline

  // Garbage / degenerate output collapses the score immediately.
  if (REPETITION_RE.test(normalized)) score -= 0.4;

  // Hedging and boilerplate drag the score below the threshold.
  for (const marker of NEGATIVE_MARKERS) {
    if (normalized.includes(marker)) {
      score -= 0.3;
      break;
    }
  }

  // Actionable, concrete content raises the score.
  for (const marker of POSITIVE_MARKERS) {
    if (normalized.includes(marker)) score += 0.08;
  }

  // A decent answer has some length but is not an unbounded rant.
  const words = normalized.split(/\s+/).length;
  if (words >= 12) score += 0.15;
  if (words > 140) score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

/** True when an answer should be replaced by the guided fallback. */
export function isLowConfidence(score: number): boolean {
  return score < LOW_CONFIDENCE_THRESHOLD;
}

/**
 * Guards a local response: if it fails confidence scoring, return the
 * guided general-advice reply instead. Passes valid answers through.
 */
export function guardLocalResponse(text: string, score?: number): { text: string; score: number } {
  const s = score ?? scoreResponseConfidence(text);
  if (isLowConfidence(s)) return { text: LOW_CONFIDENCE_REPLY, score: s };
  return { text, score: s };
}

export default scoreResponseConfidence;
