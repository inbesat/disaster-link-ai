// ---------------------------------------------------------------------
// lib/analytics/tracker.ts — Step 9 · Dual-Mode Analytics Logger
//
// Tracks feature usage differently for citizens vs responders. Mocked for
// the hackathon: logFeatureUsage only console.logs (no DB writes, saving
// rows), and getAnalyticsSummary returns canned headline numbers for the
// admin dashboard. Swap the console.log for an insert into an
// analytics_events table when real telemetry is needed — the signature
// stays the same.
// ---------------------------------------------------------------------

/**
 * Record that a feature was used, tagged by mode (role) and district.
 *
 * Async so it can become a real DB/queue write later without changing
 * call sites. Example output:
 *
 *   logFeatureUsage("sos_button", "public", "Patna")
 *   → "PUBLIC user in Patna triggered SOS_BUTTON"
 */
export async function logFeatureUsage(
  featureName: string,
  role: string,
  district: string,
): Promise<void> {
  // Respect 'Do Not Track' (DNT) browser settings & consent
  if (typeof window !== "undefined") {
    const dnt = navigator.doNotTrack === "1" || (window as any).doNotTrack === "1";
    const consent = localStorage.getItem("safesphere_cookie_consent");
    if (dnt || consent === "declined") {
      // Analytics tracking bypassed due to DNT or declined consent
      return;
    }
  }

  // Mock for the hackathon — console only, no DB writes.
  console.log(
    `${role.toUpperCase()} user in ${district} triggered ${featureName.toUpperCase()}`,
  );
}

/**
 * Mock headline numbers for the admin analytics panel.
 * Returns the exact summary string the dashboard renders.
 */
export function getAnalyticsSummary(): string {
  return "Citizens used SOS 340 times. Gov used AI Planner 42 times.";
}
