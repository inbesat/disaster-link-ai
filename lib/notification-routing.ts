// ---------------------------------------------------------------------
// lib/notification-routing.ts — Notification routing matrix state (Settings · Phase 2).
//
// Pure, framework-free logic behind the multi-channel routing grid:
// the 5 alert categories × 4 delivery channels, the recommended default
// routes, an immutable toggle reducer, and summary counters.
//
// `flipRoute` returns a brand-new Routes object (no mutation) so tests and
// the React component can rely on referential purity.
// ---------------------------------------------------------------------

export type ChannelKey = "in_app" | "browser_push" | "email" | "sms";
export type CategoryKey =
  | "flood_warnings"
  | "evacuation_orders"
  | "resource_requests"
  | "chat_mentions"
  | "system_updates";

export type Routes = Record<CategoryKey, Record<ChannelKey, boolean>>;

export const CATEGORY_KEYS: CategoryKey[] = [
  "flood_warnings",
  "evacuation_orders",
  "resource_requests",
  "chat_mentions",
  "system_updates",
];

export const CHANNEL_KEYS: ChannelKey[] = [
  "in_app",
  "browser_push",
  "email",
  "sms",
];

/** Critical categories always break through every channel. */
export const CRITICAL_CATEGORIES: CategoryKey[] = [
  "flood_warnings",
  "evacuation_orders",
];

/** Recommended canvas: critical categories fan out to every channel;
 *  non-critical ones stay in-app (and email for system notes). */
export const DEFAULT_ROUTES: Routes = {
  flood_warnings: { in_app: true, browser_push: true, email: true, sms: true },
  evacuation_orders: { in_app: true, browser_push: true, email: true, sms: true },
  resource_requests: { in_app: true, browser_push: true, email: true, sms: false },
  chat_mentions: { in_app: true, browser_push: false, email: false, sms: false },
  system_updates: { in_app: true, browser_push: false, email: true, sms: false },
};

export function initialRoutes(): Routes {
  return CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = { ...DEFAULT_ROUTES[key] };
    return acc;
  }, {} as Routes);
}

/** Immutably flip a single cell's routing state. */
export function flipRoute(
  routes: Routes,
  categoryKey: CategoryKey,
  channelKey: ChannelKey,
): Routes {
  return {
    ...routes,
    [categoryKey]: {
      ...routes[categoryKey],
      [channelKey]: !routes[categoryKey][channelKey],
    },
  };
}

/** Total number of toggled-on routes across the whole matrix. */
export function countActiveRoutes(routes: Routes): number {
  return CATEGORY_KEYS.reduce((total, category) => {
    return (
      total +
      CHANNEL_KEYS.filter((channel) => routes[category][channel]).length
    );
  }, 0);
}

/** Routes enabled for a single channel (count + which categories that is). */
export function channelEnablement(
  routes: Routes,
  channelKey: ChannelKey,
): { count: number; onCategories: CategoryKey[] } {
  const onCategories = CATEGORY_KEYS.filter((category) => routes[category][channelKey]);
  return { count: onCategories.length, onCategories };
}

// ---------------------------------------------------------------------
// Severity Threshold Filters (Settings · Phase 2 · Step 3)
// ---------------------------------------------------------------------

export type SeverityThreshold = "critical_only" | "high_and_above" | "all_alerts";

/** Ordered restrictive→permissive; the index doubles as a ranking. */
export const THRESHOLD_OPTIONS: ReadonlyArray<{
  value: SeverityThreshold;
  label: string;
  short: string;
}> = [
  { value: "critical_only", label: "Critical Only", short: "Critical" },
  { value: "high_and_above", label: "High & Above", short: "High+" },
  { value: "all_alerts", label: "All Alerts", short: "All" },
];

export type Thresholds = Record<CategoryKey, SeverityThreshold>;

/** Recommended minimums per category. Evacuation Orders ships locked. */
export const DEFAULT_THRESHOLDS: Thresholds = {
  flood_warnings: "high_and_above",
  evacuation_orders: "critical_only",
  resource_requests: "all_alerts",
  chat_mentions: "all_alerts",
  system_updates: "all_alerts",
};

/** Categories whose threshold cannot be relaxed by the operator. */
export const LOCKED_THRESHOLDS: ReadonlySet<CategoryKey> = new Set<CategoryKey>([
  "evacuation_orders",
]) as ReadonlySet<CategoryKey>;

export function isThresholdLocked(categoryKey: CategoryKey): boolean {
  return LOCKED_THRESHOLDS.has(categoryKey);
}

/** Immutable threshold update; hardened categories keep their lock. */
export function setThreshold(
  thresholds: Thresholds,
  categoryKey: CategoryKey,
  threshold: SeverityThreshold,
): Thresholds {
  if (isThresholdLocked(categoryKey)) return thresholds;
  return { ...thresholds, [categoryKey]: threshold };
}

/** Severity rank of an individual alert so filters can compare cleanly. */
export type SeverityLevel = "info" | "medium" | "high" | "critical";

/** True when `level` clears the category's minimum threshold. */
export function passesThreshold(
  thresholds: Thresholds,
  categoryKey: CategoryKey,
  level: SeverityLevel,
): boolean {
  const minimum = thresholds[categoryKey];
  const rank = (a: SeverityLevel): number =>
    a === "critical" ? 3 : a === "high" ? 2 : a === "medium" ? 1 : 0;
  const cutoff = (t: SeverityThreshold): number =>
    t === "critical_only" ? 3 : t === "high_and_above" ? 2 : 0;
  return rank(level) >= cutoff(minimum);
}