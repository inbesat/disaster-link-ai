// ---------------------------------------------------------------------
// lib/demo-mode.ts
// Global demo-mode flag (Phase 24 · Step 5).
//
// When NEXT_PUBLIC_DEMO_MODE === "true" the platform runs in demo mode:
// paid third-party integrations (e.g. Twilio SMS) are bypassed so testing
// and judge demos never cost money.
//
// The NEXT_PUBLIC_ prefix means the flag is inlined into client bundles
// too, so client components can gate demo-only UI with the same helper.
// ---------------------------------------------------------------------

/**
 * True when the app is running in demo mode
 * (process.env.NEXT_PUBLIC_DEMO_MODE === "true").
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
