// lib/security/ai-rate-limit.ts
// Rate limiter for AI/chat endpoints to prevent runaway API costs.
// Uses a simple token bucket algorithm with per-user tracking.

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export interface RateLimiterOptions {
  /** Maximum requests per window. Default: 20 */
  maxRequests?: number;
  /** Window size in milliseconds. Default: 60_000 (1 minute) */
  windowMs?: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

// Note: This is an in-memory, per-instance rate limiter. It won't work consistently
// across serverless invocations. Redis-based rate limiting should be used in production.
const aiBuckets = new Map<string, Bucket>();

// Periodically clean up expired entries to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of aiBuckets.entries()) {
      if (now > bucket.resetAt) {
        aiBuckets.delete(key);
      }
    }
  }, 60_000);
  
  if (interval.unref) {
    interval.unref();
  }
}

export function checkAiRateLimit(userId: string, options?: RateLimiterOptions): RateLimitResult {
  const maxRequests = options?.maxRequests ?? 20;
  const windowMs = options?.windowMs ?? 60_000;
  const now = Date.now();

  let bucket = aiBuckets.get(userId);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    aiBuckets.set(userId, bucket);
  }

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: bucket.resetAt - now,
    };
  }

  bucket.count++;

  return {
    allowed: true,
    remaining: maxRequests - bucket.count,
    resetInMs: bucket.resetAt - now,
  };
}
