// ---------------------------------------------------------------------
// lib/notification-tone.ts — Critical alert tone definitions (Settings · Phase 2 · Step 6).
//
// Pure tone catalog consumed by the AlertSoundCard synthesizer (Web Audio
// API) and covered by unit tests. Each tone is a list of waveform steps:
//   { freq, start, dur, gain } where times are in seconds.
//
// The card renders these as audible patterns; the only audio code (Audio
// Context creation, oscillator scheduling) lives in the component because
// it touches `window`, but the shapes below are fully unit-testable.
// ---------------------------------------------------------------------

export type ToneId = "standard_siren" | "digital_chime" | "harsh_beep" | "silent";

export type ToneStep = { freq: number; start: number; dur: number; gain: number };

export const TONE_OPTIONS: Array<{ id: ToneId; label: string }> = [
  { id: "standard_siren", label: "Standard Siren" },
  { id: "digital_chime", label: "Digital Chime" },
  { id: "harsh_beep", label: "Harsh Beep" },
  { id: "silent", label: "Silent (Vibrate Only)" },
];

export const TONE_PATTERNS: Record<ToneId, ToneStep[]> = {
  // Rising + falling two-tone siren, like the classic field alarm.
  standard_siren: [
    { freq: 740, start: 0, dur: 0.22, gain: 0.5 },
    { freq: 980, start: 0.22, dur: 0.22, gain: 0.5 },
    { freq: 740, start: 0.44, dur: 0.22, gain: 0.5 },
    { freq: 980, start: 0.66, dur: 0.28, gain: 0.5 },
  ],
  // Gentle three-note rise (C5–E5–G5) with soft envelope.
  digital_chime: [
    { freq: 523, start: 0, dur: 0.18, gain: 0.35 },
    { freq: 659, start: 0.18, dur: 0.18, gain: 0.35 },
    { freq: 784, start: 0.36, dur: 0.4, gain: 0.4 },
  ],
  // Prickly square-wave double pip — grabs attention fast.
  harsh_beep: [
    { freq: 1180, start: 0, dur: 0.12, gain: 0.4 },
    { freq: 1180, start: 0.22, dur: 0.12, gain: 0.4 },
  ],
  // Play nothing — the toggle/vibrate handles feedback.
  silent: [],
};

export const HAPTIC_PATTERN = [80, 60, 120, 60, 80];

/** True when the tone is silent (vibrate-only) and never produces audio. */
export function isSilentTone(id: ToneId): boolean {
  return id === "silent" || TONE_PATTERNS[id].length === 0;
}

/** Total rendered duration in seconds for a tone, or 0 for silent. */
export function toneDuration(id: ToneId): number {
  const pattern = TONE_PATTERNS[id];
  if (pattern.length === 0) return 0;
  return Math.max(...pattern.map((step) => step.start + step.dur));
}

/** Oscillator type the card should use for a given tone. */
export function toneOscillatorType(id: ToneId): OscillatorType {
  return id === "harsh_beep" ? "square" : "sine";
}