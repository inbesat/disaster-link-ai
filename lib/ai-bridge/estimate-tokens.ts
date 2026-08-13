// ---------------------------------------------------------------------
// lib/ai-bridge/estimate-tokens.ts — Offline-First Architecture · Phase 1
// Cheap token estimator shared by both providers (and re-exported for UI
// "approx tokens" displays). Uses the standard ~4 chars per token rule of
// thumb — good enough to predict whether a prompt fits a context window,
// not accurate enough for billing.
// ---------------------------------------------------------------------

/** Rough token count for `text` (~4 chars per token). */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // CJK-heavy scripts average ~1.5-2 chars/token; the 4-char heuristic stays
  // a reasonable upper bound across English/Hindi/regional language alerts.
  return Math.max(1, Math.ceil(text.length / 4));
}