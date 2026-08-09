"use client";

// ---------------------------------------------------------------------
// hooks/useHaptics.ts
// UI/UX Phase 3 · Step 8 — native haptic feedback wrapper.
//
// Physical confirmation for field hardware: taps and swipes buzz the
// device so the UI feels like a button, not a screen. Every call is
// guarded against browsers without the Vibration API (desktop) and any
// platform that throws on unsupported patterns.
//
//   • triggerLightHaptic()  → navigator.vibrate(15)  — every nav tap/swipe
//   • triggerHeavyHaptic()  → navigator.vibrate([50, 50, 50]) — SOS pattern
//
// useHaptics() returns both for components that prefer destructuring from
// a hook; the module-level functions read the same low-level guard.
// ---------------------------------------------------------------------

const canVibrate = (): boolean => typeof window !== "undefined" && "vibrate" in navigator;

/** Short single pulse (≈15 ms) — confirms a tap or swipe landed. */
export function triggerLightHaptic(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(15);
  } catch {
    /* unsupported platform */
  }
}

/** SOS pattern (50ms on, 50ms off, 50ms on) — reserved for emergencies. */
export function triggerHeavyHaptic(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate([50, 50, 50]);
  } catch {
    /* unsupported platform */
  }
}

/** Hook form — same guarded triggers, returned for spread/destructure use. */
export function useHaptics() {
  return { triggerLightHaptic, triggerHeavyHaptic };
}

export default useHaptics;
