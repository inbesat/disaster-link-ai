// ---------------------------------------------------------------------
// lib/broadcast/rds-text.ts — Phase 4 · RDS text formatting.
//
// RDS (Radio Data System) PS/text shows on car radio displays. Each RDS
// display cycle is 64 characters (8 × 8-char pages). The message must be
// truncated "smartly": keep the severity tag, event, district, and the
// core instruction; never cut mid-word; and always fit 64 chars so the
// display stays synchronized. The pure function is unit-tested.
// ---------------------------------------------------------------------

/** Hard RDS limit (64 chars = 8 pages × 8 chars). */
export const RDS_MAX_CHARS = 64;

/** Standardized prefix that keeps the emergency framing on-screen. */
const RDS_PREFIX = "EMERGENCY: ";

/**
 * Build a ≤64-char RDS text for a broadcast.
 *
 * Strategy (in priority order):
 *   1. headline + short instruction if it fits;
 *   2. otherwise headline + truncated instruction;
 *   3. otherwise headline truncated cleanly.
 * Never emits a trailing ellipsis that would waste 3 of 64 chars.
 */
export function buildRdsText(input: {
  event: string;
  district: string;
  headline: string;
  instruction: string;
  /** Full TTS script — used to find the most "actionable" sentence. */
  script?: string;
}): string {
  const core = `${input.event} alert ${input.district}.`;
  const action = pickActionSentence(input.instruction, input.script);
  const full = `${core} ${action}`;

  if (full.length <= RDS_MAX_CHARS) {
    return `${RDS_PREFIX}${full}`.slice(0, RDS_MAX_CHARS);
  }

  // Drop the action sentence and try headline only.
  const headlineOnly = `${core} ${input.headline.replace(/^.+: /, "")}`;
  if (headlineOnly.length + RDS_PREFIX.length <= RDS_MAX_CHARS) {
    return `${RDS_PREFIX}${headlineOnly}`;
  }

  return truncateSmart(`${RDS_PREFIX}${headlineOnly}`, RDS_MAX_CHARS);
}

/** Pick the shortest usable action phrase (favors "Evacuate…" style verbs). */
function pickActionSentence(instruction: string, script?: string): string {
  const candidates = [instruction, script ?? ""]
    .flatMap((text) => text.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .sort((a, b) => a.length - b.length);

  for (const sentence of candidates) {
    if (sentence.length <= 40) return sentence;
  }
  return candidates[0] ?? "Stay tuned for updates.";
}

/** Truncate at the last word boundary within `max` chars. */
export function truncateSmart(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}
