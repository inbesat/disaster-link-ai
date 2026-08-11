// ---------------------------------------------------------------------
// lib/demo/analytics.ts — Phase 2 · Step 9 · Judge tracking & demo
// analytics (client-side, localStorage-backed).
//
// During the live pitch every meaningful demo interaction is recorded —
// which demo buttons were clicked, which scenario was switched, when the
// presenter entered/left Gov vs Citizen mode — so the presenter can drop
// hard numbers into the Q&A ("Judges interacted with 8 features. Most
// used: SOS Trigger.").
//
//   • trackAnalytics(name, mode?) → append one event { name, mode, ts }
//   • getAnalyticsEvents()        → raw event list (oldest first)
//   • getDemoAnalyticsStats()     → computed summary for the insights page
//   • clearAnalytics()            → wipe the trail (post-conversion)
//
// Mode source: components write a "drip:demo-mode" mirror to localStorage
// (the session cookies are httpOnly so document.cookie can't read them).
// SSR-safe — every read checks for `window`.
// ---------------------------------------------------------------------

export type DemoMode = "government" | "citizen";

export type DemoAnalyticsEvent = {
  /** Human-readable event id, e.g. "action.pub.trigger-sos". */
  name: string;
  mode: DemoMode;
  /** Epoch ms — when the interaction happened. */
  ts: number;
};

const ANALYTICS_STORAGE_KEY = "drip:demo-analytics";
const MODE_MIRROR_KEY = "drip:demo-mode";
const MAX_EVENTS = 500;

/** Client-side mirror of the active demo role (see header note). */
export function setDemoModeStore(mode: DemoMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MODE_MIRROR_KEY, mode);
  } catch {
    // Storage unavailable — analytics still work, just without the mirror.
  }
}

/**
 * Current demo mode for analytics. Falls back to the localStorage mirror
 * written by the demo panels, defaulting to "government".
 */
export function getDemoMode(): DemoMode {
  if (typeof window === "undefined") return "government";
  try {
    return window.localStorage.getItem(MODE_MIRROR_KEY) === "citizen"
      ? "citizen"
      : "government";
  } catch {
    return "government";
  }
}

/** Record one demo interaction. Never throws. */
export function trackAnalytics(name: string, mode?: DemoMode): void {
  if (typeof window === "undefined") return;
  try {
    const events = getAnalyticsEvents();
    events.push({ name, mode: mode ?? getDemoMode(), ts: Date.now() });
    // Keep the trail bounded — a long pitch must not grow it unboundedly.
    window.localStorage.setItem(
      ANALYTICS_STORAGE_KEY,
      JSON.stringify(events.slice(-MAX_EVENTS)),
    );
  } catch {
    // Tracking is best-effort; a full/damaged store is never fatal.
  }
}

/** Raw chronological trail of recorded demo interactions. */
export function getAnalyticsEvents(): DemoAnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is DemoAnalyticsEvent =>
          !!e &&
          typeof (e as DemoAnalyticsEvent).name === "string" &&
          typeof (e as DemoAnalyticsEvent).ts === "number",
      )
      .sort((a, b) => a.ts - b.ts);
  } catch {
    return [];
  }
}

/** Wipe the entire trail (used after a judge converts to a real account). */
export function clearAnalytics(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  } catch {
    // Best-effort.
  }
}

/**
 * Computed summary for the /demo/insights page.
 *
 *   totalInteractions — every recorded event (buttons, mode switches…).
 *   features          — unique `action.*` names (the feature buttons).
 *   mostUsed          — { name, count } of the most-tapped feature.
 *   modeInteractions  — gov vs citizen tap counts.
 *   modeMs            — estimated time spent per mode: from the first to
 *                       the last event in that mode, plus any elapsed time
 *                       since the most recent event if that mode is the
 *                       active one (the "still-presenting" tail).
 */
export function getDemoAnalyticsStats() {
  const events = getAnalyticsEvents();
  if (events.length === 0) {
    return {
      totalInteractions: 0,
      features: [] as string[],
      mostUsed: null as { name: string; count: number } | null,
      modeInteractions: { government: 0, citizen: 0 } as Record<DemoMode, number>,
      modeMs: { government: 0, citizen: 0 } as Record<DemoMode, number>,
      now: Date.now(),
    };
  }

  const featureCounts = new Map<string, number>();
  const modeInteractions: Record<DemoMode, number> = { government: 0, citizen: 0 };
  const firstTs: Record<DemoMode, number> = { government: 0, citizen: 0 };
  const lastTs: Record<DemoMode, number> = { government: 0, citizen: 0 };

  for (const e of events) {
    modeInteractions[e.mode] += 1;
    if (firstTs[e.mode] === 0 || e.ts < firstTs[e.mode]) firstTs[e.mode] = e.ts;
    if (e.ts > lastTs[e.mode]) lastTs[e.mode] = e.ts;
    if (e.name.startsWith("action.")) {
      featureCounts.set(e.name, (featureCounts.get(e.name) ?? 0) + 1);
    }
  }

  const features = Array.from(featureCounts.keys());
  let mostUsed: { name: string; count: number } | null = null;
  for (const [name, count] of Array.from(featureCounts.entries())) {
    if (!mostUsed || count > mostUsed.count) mostUsed = { name, count };
  }

  const latest = events[events.length - 1];
  const latestMode = latest.mode;
  const modeMs: Record<DemoMode, number> = { government: 0, citizen: 0 };
  for (const mode of ["government", "citizen"] as const) {
    if (firstTs[mode] === 0) continue;
    const span = lastTs[mode] - firstTs[mode];
    // If this mode produced the most recent event, the presenter is likely
    // still inside it — count the open tail up to now.
    const tail = mode === latestMode ? Date.now() - lastTs[mode] : 0;
    modeMs[mode] = Math.max(0, span + tail);
  }

  return {
    totalInteractions: events.length,
    features,
    mostUsed,
    modeInteractions,
    modeMs,
    now: Date.now(),
  };
}

export default getDemoAnalyticsStats;