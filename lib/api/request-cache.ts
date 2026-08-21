// ---------------------------------------------------------------------
// lib/api/request-cache.ts — API Call Optimization & Deduplication Manager
//
// Provides:
//   1. Request deduplication — in-flight requests share promises.
//   2. Tiered staleTime caching per entity type:
//      • userProfile: 5 minutes (300,000 ms)
//      • shelterData: 2 minutes (120,000 ms)
//      • floodPredictions: 1 minute (60,000 ms)
//      • resourceInventory: 30 seconds (30,000 ms)
//   3. AbortController cancellation for superseded/outdated requests.
//   4. Visibility-aware polling helper (pauses when document.hidden).
// ---------------------------------------------------------------------

export const STALE_TIMES = {
  userProfile: 5 * 60 * 1000, // 5 minutes
  shelterData: 2 * 60 * 1000, // 2 minutes
  floodPredictions: 60 * 1000, // 1 minute
  resourceInventory: 30 * 1000, // 30 seconds
} as const;

export type EntityCacheKey = keyof typeof STALE_TIMES;

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const activeControllers = new Map<string, AbortController>();

/**
 * Fetch or retrieve cached data with request deduplication and AbortController cancellation.
 */
export async function fetchWithDedupeAndCache<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  staleTimeMs: number = STALE_TIMES.resourceInventory,
  options: { forceRefresh?: boolean } = {},
): Promise<T> {
  const now = Date.now();
  const cached = cacheStore.get(key) as CacheEntry<T> | undefined;

  if (!options.forceRefresh && cached && now - cached.timestamp < staleTimeMs) {
    return cached.data;
  }

  // Deduplicate in-flight requests unless forceRefresh is specified
  if (!options.forceRefresh && inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  // Abort any prior pending request for this key if forceRefresh or replacing
  if (activeControllers.has(key)) {
    activeControllers.get(key)?.abort();
  }

  const controller = new AbortController();
  activeControllers.set(key, controller);

  const promise = (async () => {
    try {
      const data = await fetcher(controller.signal);
      cacheStore.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightRequests.delete(key);
      if (activeControllers.get(key) === controller) {
        activeControllers.delete(key);
      }
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

/** Clear cache entries (globally or by prefix). */
export function clearRequestCache(prefix?: string) {
  if (!prefix) {
    cacheStore.clear();
    return;
  }
  for (const k of Array.from(cacheStore.keys())) {
    if (k.startsWith(prefix)) cacheStore.delete(k);
  }
}

/** Helper for polling timers: returns true if polling should run (tab is visible). */
export function isPollingAllowed(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}
