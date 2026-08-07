// ---------------------------------------------------------------------
// lib/security/rate-limit.ts — Phase 21 (Security, Privacy & Data Isolation)
//
// In-memory sliding-window rate limiter. Tracks request timestamps per
// identifier (IP address, user id, phone number, …) in a plain Map and lets
// callers decide whether a request is allowed.
//
//   const result = rateLimit(clientIp, 5, 60_000);
//   if (!result.success) → respond 429 with Retry-After = result.resetTime - now
//
// Sufficient for the demo and for protecting our AI and SMS endpoints from
// spam and runaway cost. Swap `buckets` for a Redis-backed store (sorted set
// per key, INCR+EXPIRE) when this runs at multi-instance scale — the API is
// intentionally identical so callers never change.
// ---------------------------------------------------------------------

export interface RateLimitResult {
  /** Whether the request may proceed. */
  success: boolean;
  /** Requests still available in the current window (0 when limited). */
  remaining: number;
  /** Epoch ms when the window resets and the identifier can retry. */
  resetTime: number;
}

/** identifier → ascending request timestamps within their windows. */
const buckets = new Map<string, number[]>();

/**
 * Memory bound: once the number of tracked identifiers exceeds this, buckets
 * whose window has fully aged out are swept so a rotating-IP attacker cannot
 * grow memory without limit.
 */
export const MAX_TRACKED_IDENTIFIERS = 10_000;

function sweepExpired(now: number, windowMs: number): void {
  if (buckets.size <= MAX_TRACKED_IDENTIFIERS) return;
  const cutoff = now - windowMs;
  for (const [key, timestamps] of Array.from(buckets)) {
    const last = timestamps[timestamps.length - 1];
    if (timestamps.length === 0 || last <= cutoff) buckets.delete(key);
  }
}

/**
 * Consume one request slot for `identifier` under a sliding window of
 * `limit` requests per `windowMs` milliseconds.
 *
 * - Window slides: timestamps older than `now - windowMs` are pruned on every
 *   call, so the limiter self-heals without a background sweeper.
 * - `resetTime` is derived from the oldest in-window request (when the bucket
 *   empties enough to admit the next request) — used for `Retry-After`.
 * - Identifiers are independent: one abusive client never starves others.
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  const existing = buckets.get(identifier) ?? [];
  const active = existing.filter((t) => t > cutoff);
  // Opportunistic memory bound for rotating identifiers (see above).
  sweepExpired(now, windowMs);
  const resetTime = active.length > 0 ? active[0] + windowMs : now + windowMs;

  if (active.length >= limit) {
    buckets.set(identifier, active);
    return { success: false, remaining: 0, resetTime };
  }

  active.push(now);
  buckets.set(identifier, active);
  return { success: true, remaining: limit - active.length, resetTime };
}

/**
 * Convenience factory: bind a fixed limit/window to a limiter so endpoints
 * can name their budget once and call `limiter(identifier)` per request.
 *
 *   const chatLimiter = createRateLimiter(5, 60_000);
 *   const result = chatLimiter(clientIp);
 */
export function createRateLimiter(limit: number, windowMs: number) {
  return (identifier: string): RateLimitResult => rateLimit(identifier, limit, windowMs);
}

/** Clear all buckets — used by tests and the admin "reset" health action. */
export function resetRateLimits(): void {
  buckets.clear();
}

/** Number of tracked identifiers (test/debug surface). */
export function rateLimitBucketCount(): number {
  return buckets.size;
}
