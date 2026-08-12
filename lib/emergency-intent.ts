// ---------------------------------------------------------------------
// lib/emergency-intent.ts — Phase 1 · Step 2 · emergency intent detection.
//
// Pure detector: does a citizen's message (typed or a voice transcript)
// carry an emergency intent? NovaChat intercepts every input with this
// BEFORE it reaches the reply path — if true, the chat flips to Emergency
// Mode and the SOS flow fires instead of a normal answer.
//
// Keywords per the Phase 1 spec (help / trapped / flood / rescue /
// medical / emergency) plus the common Hindi equivalents, so a Hindi
// voice transcript (the voice engine often runs hi-IN) still triggers.
//
// Pure + side-effect free so it can run in the UI and (later) in server
// SMS keyword scanning, and is trivially unit-testable.
// ---------------------------------------------------------------------

/** English emergency keywords — matches as whole words. */
export const EMERGENCY_ENGLISH = [
  "help",
  "trapped",
  "flood",
  "rescue",
  "medical",
  "emergency",
] as const;

/** Hindi equivalents — substring match (Hindi has no word boundaries). */
export const EMERGENCY_HINDI = [
  "बचाओ",
  "मदद",
  "फंस",
  "बाढ़",
  "राहत",
  "इमरजेंसी",
] as const;

/** Word-boundary regex built from the English list (case-insensitive). */
const EMERGENCY_RE = new RegExp(
  `\\b(${EMERGENCY_ENGLISH.join("|")})\\b`,
  "i",
);

/** True when the input carries an emergency intent (text or voice). */
export function detectEmergency(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_RE.test(lower) || EMERGENCY_HINDI.some((w) => lower.includes(w));
}
