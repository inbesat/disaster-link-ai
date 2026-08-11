// ---------------------------------------------------------------------
// lib/alerts/countdown.ts — Phase 3 · Step 3 · critical-alert countdown.
//
// Pure HH:MM:SS formatting for the CriticalAlertOverlay's "Flood expected
// in 04:00:00" timer. Lives in lib so the step's timing logic is
// unit-testable without pulling in the full component (which imports
// framer-motion, next/link and the speech hooks).
// ---------------------------------------------------------------------

/** 14400 → "04:00:00" (zero-padded, clamped at 0). */
export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
