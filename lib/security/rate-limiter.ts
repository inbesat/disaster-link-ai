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
  public: 30,
  field_responder: 100,
  admin: 300,
} as const;

export type RateLimitTier = keyof typeof ROLE_RATE_LIMITS;

export interface RoleRateLimitResult extends RateLimitResult {
  /** The allowance of the resolved tier (useful for Retry-After headers). */
  limit: number;
}

/**
 * Map any role string (UserRole enum, `role` cookie, "viewer", unknown,
 * empty) to the coarsest rate-limit tier:
 *
 *   super_admin / district_admin / admin → admin        (300 req/min)
 *   field_responder                      → field_responder (100 req/min)
 *   everything else                      → public       (30 req/min)
 *
 * The fallback deliberately errs toward the STRICTEST tier: an unknown or
 * spoofed role must never buy itself a bigger budget.
 */
export function rateLimitTierForRole(role: string | null | undefined): RateLimitTier {
  switch (role) {
    case "super_admin":
    case "district_admin":
    case "admin":
      return "admin";
    case "field_responder":
      return "field_responder";
    default:
      return "public";
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
): RoleRateLimitResult {
  const tier = rateLimitTierForRole(role);
  const limit = ROLE_RATE_LIMITS[tier];
  const result = rateLimit(`${tier}:${ip}`, limit, RATE_LIMIT_WINDOW_MS);
  return { ...result, limit };
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
