// ---------------------------------------------------------------------
// lib/mock-data/public-alerts.ts — Phase 3 · Steps 1–2 · citizen alerts
// feed data.
//
// The public /public/alerts page renders these mock warnings. This is
// the single edit point for demo state — swap in real alert-engine rows
// (server/services/alert-engine.ts + lib/ml-client.ts) later by
// replacing the PUBLIC_ALERTS constant with a fetch, keeping the typed
// shape and the pure helpers (filterAlertsByScope, relativeTime)
// unchanged.
//
// Filtering model (Phase 3 · Step 1):
//   • my-area   → alerts targeting the citizen's own locality (the demo
//                 citizen lives in Kankarbagh, Patna)
//   • district  → district-wide warnings (Bihar districts, mirroring the
//                 hazard-zones list)
//   • state     → state-level advisories
// Timestamps are computed relative to load (minutesAgoIso) so the demo
// always reads as "just now / 8m ago" no matter when it runs.
// ---------------------------------------------------------------------

export type PublicAlertType = "flood" | "rain" | "road";

/** Green / amber / red — maps to the severity tokens on the card. */
export type PublicAlertSeverity = "safe" | "warning" | "critical";

/** Which filter bucket an alert belongs to. */
export type PublicAlertScope = "my-area" | "district" | "state";

export type PublicAlert = {
  /** Stable id — key for lists + future read-state persistence. */
  id: string;
  /** Alert category — drives the Lucide icon on the card. */
  type: PublicAlertType;
  /** Risk tier — drives the 4px bar + badge colour. */
  severity: PublicAlertSeverity;
  /** Filter bucket for the Step 1 filter bar. */
  scope: PublicAlertScope;
  /** Plain-language headline. */
  title: string;
  /** Plain-language body copy. */
  body: string;
  /** Step-by-step actions for the AlertDetailModal checklist. */
  actions: string[];
  /** Official government order vs community rumour (Phase 3 · Step 8). */
  isOfficial: boolean;
  /** Crowd-verification tallies (official alerts don't render the UI). */
  upvotes: number;
  downvotes: number;
  /** ISO timestamp — rendered as a relative label by `relativeTime`. */
  timestamp: string;
};

/** ISO string `minutes` ago — keeps the mock feed fresh on every load. */
export function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

// --- Offline cache (Phase 3 · Step 7) ---------------------------------
// The feed is written to localStorage on load and re-read when the device
// is offline, so a citizen whose internet drops mid-flood still sees the
// last known alerts (with the "Showing cached alerts from …" banner).

export const ALERTS_CACHE_KEY = "drip:cached-alerts";
export const ALERTS_CACHE_TIME_KEY = "drip:cached-alerts-at";

/** Persist the current feed + a timestamp (guarded, never throws). */
export function cacheAlerts(alerts: PublicAlert[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ALERTS_CACHE_KEY, JSON.stringify(alerts));
    window.localStorage.setItem(ALERTS_CACHE_TIME_KEY, new Date().toISOString());
  } catch {
    // storage unavailable — cache just won't persist
  }
}

/**
 * Full-shape type guard. The offline cache round-trips through JSON, so a
 * stale/partial/older-version payload must never reach the UI — AlertCard
 * and AlertDetailModal index `type`/`severity` and map `actions`, so any
 * missing field would crash at render time. Every consumer-facing field is
 * validated here. (Alerts not in the union get dropped too.)
 */
export function isPublicAlert(value: unknown): value is PublicAlert {
  if (!value || typeof value !== "object") return false;
  const a = value as Partial<PublicAlert>;
  return (
    typeof a.id === "string" &&
    (["flood", "rain", "road"] as PublicAlertType[]).includes(
      a.type as PublicAlertType,
    ) &&
    (["safe", "warning", "critical"] as PublicAlertSeverity[]).includes(
      a.severity as PublicAlertSeverity,
    ) &&
    (["my-area", "district", "state"] as PublicAlertScope[]).includes(
      a.scope as PublicAlertScope,
    ) &&
    typeof a.title === "string" &&
    typeof a.body === "string" &&
    Array.isArray(a.actions) &&
    a.actions.every((x) => typeof x === "string") &&
    typeof a.isOfficial === "boolean" &&
    typeof a.upvotes === "number" &&
    Number.isInteger(a.upvotes) &&
    a.upvotes >= 0 &&
    typeof a.downvotes === "number" &&
    Number.isInteger(a.downvotes) &&
    a.downvotes >= 0 &&
    typeof a.timestamp === "string" &&
    !Number.isNaN(new Date(a.timestamp).getTime())
  );
}

/** Read the cached feed back; null when absent/corrupt/invalid. */
export function readCachedAlerts(): {
  alerts: PublicAlert[] | null;
  cachedAt: string | null;
} {
  if (typeof window === "undefined") return { alerts: null, cachedAt: null };
  try {
    const raw = window.localStorage.getItem(ALERTS_CACHE_KEY);
    const cachedAt = window.localStorage.getItem(ALERTS_CACHE_TIME_KEY);
    if (!raw) return { alerts: null, cachedAt };
    const parsed = JSON.parse(raw) as unknown;
    const alerts = Array.isArray(parsed) ? parsed.filter(isPublicAlert) : [];
    return { alerts: alerts.length > 0 ? alerts : null, cachedAt };
  } catch {
    return { alerts: null, cachedAt: null };
  }
}

/** ISO → "HH:MM" for the banner; null in → null out. */
export function formatCachedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// --- Demo-day wiring (Phase 3 · Steps 9–10) ----------------------------
// The judge trigger (AlertDemoTrigger, mounted in the public layout) and
// the alerts page talk over window events — the same architecture as
// hooks/useDemoSimulation's drip:demo-sim:* events.

/** Push a simulated alert into the citizen feed (detail: PublicAlert). */
export const CITIZEN_DEMO_ALERT_EVENT = "drip:citizen-demo-alert";

/** Open the critical takeover overlay (no payload needed). */
export const CITIZEN_CRITICAL_ALERT_EVENT = "drip:citizen-critical-alert";

/** Ask the citizen the periodic "are you still safe?" check-in (Step 8). */
export const CITIZEN_SAFETY_NUDGE_EVENT = "drip:citizen-safety-nudge";

/** Open the SOS modal via the simulated shake (Step 9–10). */
export const CITIZEN_SHAKE_SOS_EVENT = "drip:citizen-shake-sos";

/** localStorage key for the "I am Safe" status (Phase 3 · Step 9). */
export const SAFE_STATUS_KEY = "drip:i-am-safe";

/** SSR-safe read of the citizen's "I am Safe" status. */
export function readSafeStatus(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SAFE_STATUS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist the "I am Safe" status (guarded, never throws). */
export function writeSafeStatus(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAFE_STATUS_KEY, "1");
  } catch {
    // storage unavailable — status just won't persist
  }
}

// --- "Trapped" status (Phase 1 · Step 2) --------------------------------
// When Nova detects an emergency intent it marks the citizen as TRAPPED
// — the mirror image of "I am Safe". Persisted so a reload keeps the
// trapped flag (the control-room/family view in this demo reads it the
// same way it reads the SOS-active flag). Same guarded helpers as above.

export const TRAPPED_STATUS_KEY = "drip:citizen-trapped";

/** SSR-safe read — true while the citizen is marked as trapped. */
export function readTrappedStatus(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TRAPPED_STATUS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Mark the citizen as trapped (guarded, never throws). */
export function writeTrappedStatus(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRAPPED_STATUS_KEY, "1");
  } catch {
    // storage unavailable — trapped status just won't persist
  }
}

// --- Active SOS state (Phase 5 · Step 4) --------------------------------
// Once a rescue/medical SOS is confirmed, the app enters Emergency Mode:
// a persistent red banner on every page until the citizen cancels it. The
// flag lives in localStorage so a reload mid-emergency keeps the banner
// ("help is on the way" must survive a refresh). Same guarded helpers as
// the safe-status above.

export const SOS_ACTIVE_KEY = "drip:sos-active";

/** SSR-safe read — true while an SOS is active (Emergency Mode). */
export function readSosActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SOS_ACTIVE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist the active SOS (guarded, never throws). */
export function writeSosActive(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOS_ACTIVE_KEY, "1");
  } catch {
    // storage unavailable — Emergency Mode just won't survive a reload
  }
}

/** Clear the active SOS (cancel). Guarded, never throws. */
export function clearSosActive(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SOS_ACTIVE_KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}

/**
 * The alert the Dev-Tools trigger pushes. Type `rain` (not `flood`) so
 * preference filtering never hides it — a citizen who disabled Floods
 * still sees the simulated official alert land in the feed.
 */
export function createSimulatedOfficialAlert(): PublicAlert {
  return {
    id: `sim-${Date.now()}`,
    type: "rain",
    severity: "warning",
    scope: "my-area",
    title: "IMD Update: Heavy Rain Warning",
    body: "The India Meteorological Department forecasts intense rainfall in Patna over the next 6 hours. Avoid low-lying roads and underpasses.",
    actions: [
      "Stay indoors unless travel is essential",
      "Keep an umbrella, torch and power bank ready",
      "Avoid low-lying roads and underpasses",
    ],
    isOfficial: true,
    upvotes: 0,
    downvotes: 0,
    timestamp: minutesAgoIso(0),
  };
}

// Mock feed — Patna/Bihar flavoured, mirroring the demo district. Five
// entries keep every filter tab non-empty (My Area 2 · District 2 ·
// State 1).
export const PUBLIC_ALERTS: PublicAlert[] = [
  {
    id: "pa-flood-ganga",
    type: "flood",
    severity: "critical",
    scope: "my-area",
    title: "Ganga River Near Danger Level",
    body: "Water is 0.4 m above the danger mark near the Kankarbagh ghats. Move to higher ground now.",
    actions: [
      "Pack ID cards, medicines and important documents",
      "Move to higher ground immediately",
      "Turn off gas and electricity before you leave",
      "Charge your phone and keep it on silent with vibration",
    ],
    isOfficial: true,
    upvotes: 0,
    downvotes: 0,
    timestamp: minutesAgoIso(8),
  },
  {
    id: "pa-rain-heavy",
    type: "rain",
    severity: "warning",
    scope: "my-area",
    title: "Heavy Rain Forecast Tonight",
    body: "Up to 120 mm expected in the next 12 hours. Clear your drains and avoid low-lying roads.",
    actions: [
      "Clear drains and balconies of debris",
      "Keep an umbrella, torch and power bank ready",
      "Avoid low-lying roads and underpasses",
      "Stay tuned for further updates",
    ],
    isOfficial: false,
    upvotes: 34,
    downvotes: 6,
    timestamp: minutesAgoIso(35),
  },
  {
    id: "br-road-danapur",
    type: "road",
    severity: "warning",
    scope: "district",
    title: "Road Closed: Patna–Danapur",
    body: "The stretch near Danapur is submerged. Use the NH-31 alternate route.",
    actions: [
      "Use the NH-31 alternate route",
      "Allow extra travel time",
      "Do not drive through flooded stretches",
    ],
    isOfficial: false,
    upvotes: 12,
    downvotes: 3,
    timestamp: minutesAgoIso(68),
  },
  {
    id: "br-flood-barh",
    type: "flood",
    severity: "critical",
    scope: "district",
    title: "Evacuation Advisory: Barh",
    body: "Riverine breach risk in Barh block. Shelter is open at Barh High School.",
    actions: [
      "Leave low-lying areas immediately",
      "Proceed to Barh High School shelter",
      "Carry documents, cash and medicines",
      "Help neighbours who need assistance",
    ],
    isOfficial: true,
    upvotes: 0,
    downvotes: 0,
    timestamp: minutesAgoIso(125),
  },
  {
    id: "br-road-nh31",
    type: "road",
    severity: "safe",
    scope: "state",
    title: "NH-31 Section Reopened",
    body: "The flood-damaged stretch near Mokama has reopened after repair.",
    actions: [
      "All-clear — normal traffic can resume",
      "Drive carefully near the repaired section",
    ],
    isOfficial: true,
    upvotes: 0,
    downvotes: 0,
    timestamp: minutesAgoIso(310),
  },
];

/** Filter bar options — "all" plus every scope, in display order. */
export type AlertFilter = "all" | PublicAlertScope;

export const ALERT_FILTERS: ReadonlyArray<{ key: AlertFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "my-area", label: "My Area" },
  { key: "district", label: "District" },
  { key: "state", label: "State" },
] as const;

/** Pure filter — drives the Step 1 filter bar. "all" returns the input. */
export function filterAlertsByScope(
  alerts: PublicAlert[],
  filter: AlertFilter,
): PublicAlert[] {
  if (filter === "all") return alerts;
  return alerts.filter((alert) => alert.scope === filter);
}

/**
 * Relative timestamp label for the card ("8m ago"). Pure — `now` is
 * injectable for tests. Falls back to a short date past 24 h, and "" for
 * unparseable input (the card shows nothing rather than "Invalid Date").
 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}
