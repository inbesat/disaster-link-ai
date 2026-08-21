// lib/security/ai-rate-limit.ts
// Rate limiter for AI/chat endpoints to prevent runaway API costs.
// Uses a simple token bucket algorithm with per-user tracking.

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  message?: string;
  demoMode?: boolean;
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

export interface AiUsageLog {
  userId: string;
  action: "chat" | "plan" | "translate";
  timestamp: string;
  tokensUsed?: number;
}

// In-memory usage log store
export const aiUsageLogs: AiUsageLog[] = [];

export function logAiUsage(userId: string, action: "chat" | "plan" | "translate", tokensUsed?: number): void {
  aiUsageLogs.push({
    userId,
    action,
    timestamp: new Date().toISOString(),
    tokensUsed,
  });
  if (aiUsageLogs.length > 5000) {
    aiUsageLogs.shift();
  }
}

// Note: This is an in-memory, per-instance rate limiter. It won't work consistently
// across serverless invocations. Redis-based rate limiting should be used in production.
const aiBuckets = new Map<string, Bucket>();

// Periodically clean up expired entries to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const interval = setInterval(() => {
    const now = Date.now();
    aiBuckets.forEach((bucket, key) => {
      if (now > bucket.resetAt) {
        aiBuckets.delete(key);
      }
    });
  }, 60_000);

  if (interval.unref) {
    interval.unref();
  }
}

export function checkAiRateLimit(
  userId: string,
  action: string = "general",
  options?: RateLimiterOptions,
  isDemo?: boolean,
): RateLimitResult {
  if (isDemo) {
    return {
      allowed: true,
      remaining: 999,
      resetInMs: 0,
      message: "Demo mode: AI responses are simulated",
      demoMode: true,
    };
  }

  const maxRequests = options?.maxRequests ?? 20;
  const windowMs = options?.windowMs ?? 60_000;
  const now = Date.now();

  const key = `${action}:${userId}`;
  let bucket = aiBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    aiBuckets.set(key, bucket);
  }

  if (bucket.count >= maxRequests) {
    const minutesLeft = Math.max(1, Math.ceil((bucket.resetAt - now) / 60_000));
    return {
      allowed: false,
      remaining: 0,
      resetInMs: bucket.resetAt - now,
      message: `AI assistant is busy. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
    };
  }

  bucket.count++;

  return {
    allowed: true,
    remaining: maxRequests - bucket.count,
    resetInMs: bucket.resetAt - now,
  };
}

/** Prompt 7.2: AI Chat Rate Limit (20 messages per user per 5 minutes) */
export function checkAiChatRateLimit(userId: string, isDemo?: boolean): RateLimitResult {
  return checkAiRateLimit(userId, "chat", { maxRequests: 20, windowMs: 5 * 60 * 1000 }, isDemo);
}

/** Prompt 7.2: AI Evacuation/Emergency Planning Rate Limit (5 plans per user per 15 minutes) */
export function checkAiPlanRateLimit(userId: string, isDemo?: boolean): RateLimitResult {
  return checkAiRateLimit(userId, "plan", { maxRequests: 5, windowMs: 15 * 60 * 1000 }, isDemo);
}

/** Prompt 7.2: AI Translation Rate Limit (50 translations per user per hour) */
export function checkAiTranslateRateLimit(userId: string, isDemo?: boolean): RateLimitResult {
  return checkAiRateLimit(userId, "translate", { maxRequests: 50, windowMs: 60 * 60 * 1000 }, isDemo);
}
