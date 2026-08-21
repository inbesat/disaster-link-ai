// ---------------------------------------------------------------------
// lib/security/rate-limiter.ts — Step 5 · Role-Based Rate Limiting
//
// Tiered request budgets on top of the shared in-memory sliding window
// (./rate-limit). Each role gets a per-IP allowance per minute:
//
//   public            30 req/min   (Citizen App — read-only endpoints)
//   field_responder  100 req/min   (field sync + occupancy updates)
//   admin            300 req/min   (Command Center real-time endpoints)
//
// Buckets are keyed by `${tier}:${ip}`, so one role's traffic never eats
// another role's budget and one abusive client never starves the rest.
//
// Like the base limiter this store is in-memory — sufficient for a single
// instance/demo. At multi-instance scale swap the base buckets for Upstash
// Redis (sorted set per key, INCR + EXPIRE); this module's API stays the
// same, so callers never change.
// ---------------------------------------------------------------------

import { rateLimit, type RateLimitResult } from "./rate-limit";

/** The rolling window shared by every tier (1 minute). */
export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Per-role per-minute request allowances (Step 5 spec). */
export const ROLE_RATE_LIMITS = {
  super_admin: 600,
  district_admin: 300,
  admin: 300,
  field_responder: 100,
  demo: 60,
  public: 30,
  anonymous: 10,
} as const;

export type RateLimitTier = keyof typeof ROLE_RATE_LIMITS;

export interface RoleRateLimitResult extends RateLimitResult {
  /** The allowance of the resolved tier (useful for Retry-After headers). */
  limit: number;
}

/** Specialized endpoint rate limit windows and allowances (Prompt 7.1). */
export const SPECIALIZED_RATE_LIMITS = {
  auth_login: { limit: 5, windowMs: 15 * 60 * 1000 },       // 5 attempts per 15 min
  auth_reset: { limit: 3, windowMs: 60 * 60 * 1000 },       // 3 resets per hour
  sms_send: { limit: 5, windowMs: 60 * 1000 },              // 5 per min
  map_tiles: { limit: 100, windowMs: 60 * 1000 },            // 100 per min
  ip_abuse_block: { limit: 100, windowMs: 60 * 1000 },       // >100 req/min
} as const;

/**
 * Map any role string or context to the appropriate rate-limit tier:
 *
 *   super_admin                          → super_admin (600 req/min)
 *   district_admin / admin               → district_admin (300 req/min)
 *   field_responder                      → field_responder (100 req/min)
 *   demo (demo_mode)                     → demo (60 req/min)
 *   public                               → public (30 req/min)
 *   anonymous / guest / empty            → anonymous (10 req/min)
 */
export function rateLimitTierForRole(
  role: string | null | undefined,
  isDemo?: boolean,
): RateLimitTier {
  if (isDemo) return "demo";
  switch (role) {
    case "super_admin":
      return "super_admin";
    case "district_admin":
    case "admin":
      return "district_admin";
    case "field_responder":
      return "field_responder";
    case "public":
      return "public";
    default:
      return "anonymous";
  }
}

/**
 * Consume one request slot for `role` from `ip`. Returns the shared
 * RateLimitResult plus the tier's `limit`, so callers can build 429
 * responses with Retry-After + remaining headers.
 */
export function rateLimitByRole(
  role: string | null | undefined,
  ip: string,
  isDemo?: boolean,
): RoleRateLimitResult {
  const tier = rateLimitTierForRole(role, isDemo);
  const limit = ROLE_RATE_LIMITS[tier];
  const result = rateLimit(`${tier}:${ip}`, limit, RATE_LIMIT_WINDOW_MS);
  return { ...result, limit };
}

/** Rate limiter for specialized auth login endpoint (5 attempts / 15 min). */
export function checkAuthLoginRateLimit(ip: string): RateLimitResult {
  const { limit, windowMs } = SPECIALIZED_RATE_LIMITS.auth_login;
  return rateLimit(`auth_login:${ip}`, limit, windowMs);
}

/** Rate limiter for password reset endpoint (3 attempts / 1 hour). */
export function checkPasswordResetRateLimit(ip: string): RateLimitResult {
  const { limit, windowMs } = SPECIALIZED_RATE_LIMITS.auth_reset;
  return rateLimit(`auth_reset:${ip}`, limit, windowMs);
}

/** Rate limiter for SMS alert sending (5 per min per user/ip). */
export function checkSmsRateLimit(identifier: string): RateLimitResult {
  const { limit, windowMs } = SPECIALIZED_RATE_LIMITS.sms_send;
  return rateLimit(`sms_send:${identifier}`, limit, windowMs);
}

/** Rate limiter for map tiles (100 per min per ip). */
export function checkMapTileRateLimit(ip: string): RateLimitResult {
  const { limit, windowMs } = SPECIALIZED_RATE_LIMITS.map_tiles;
  return rateLimit(`map_tiles:${ip}`, limit, windowMs);
}

/** IP-based general abuse block (>100 requests per minute from same IP). */
export function checkIpAbuseBlock(ip: string): RateLimitResult {
  const { limit, windowMs } = SPECIALIZED_RATE_LIMITS.ip_abuse_block;
  return rateLimit(`ip_abuse:${ip}`, limit, windowMs);
}

/**
 * Best-effort client IP from the request: the first entry of the
 * `x-forwarded-for` chain (set by Vercel/nginx/proxies), falling back to
 * "anonymous" when absent — mirrors the chat endpoint's client key.
 */
export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}
