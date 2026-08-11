// ---------------------------------------------------------------------
// lib/demo/scope.ts — Phase 2 · Step 8 · Demo session isolation.
//
// Server-side session scoping. Every demo login pins a fresh `demo_session_id`
// UUID cookie (app/actions/auth.ts). This module exposes:
//
//   • resolveDemoScope() — reads the session cookies and answers "is this
//     request a demo session, and which demo session is it?".
//   • demoWhere(scope)   — a Prisma WHERE fragment that hard-scopes any
//     query: a demo session only ever sees `isDemo: true` rows owned by
//     ITS sessionId, while real users only see `isDemo: false` rows. That
//     is the slide's "WHERE isDemo is true AND sessionId = ?" — demo data
//     can never leak into the real app, and live ops data can never leak
//     into a demo.
//
// Any shared data-fetch utility operating on the operational tables should
// merge `demoWhere(scope)` into its where clause (see /api/road-closures).
// Demo writes (the scenario seed) must tag rows with the same
// { isDemo, sessionId } pair so the scoping stays airtight.
// ---------------------------------------------------------------------

import { cookies } from "next/headers";

/** Cookie pinned by govDemoLogin / publicDemoLogin; cleaned on exit. */
export const DEMO_SESSION_COOKIE = "demo_session_id";

export type DemoScope = {
  /** True when the current visitor holds a `demo_mode=true` session. */
  demo: boolean;
  /** The UUID identifying this specific demo session, or null. */
  sessionId: string | null;
};

/**
 * Resolve the current request's demo scope from the session cookies.
 * Server-only — use from middleware/compatible contexts only; reading
 * cookies in a server component or route handler is fine.
 */
export function resolveDemoScope(): DemoScope {
  const store = cookies();
  return {
    demo: store.get("demo_mode")?.value === "true",
    sessionId: store.get(DEMO_SESSION_COOKIE)?.value ?? null,
  };
}

/**
 * Prisma WHERE fragment scoped to the request's demo identity.
 *
 *   demo session  → { isDemo: true, sessionId }   (only THIS session's rows)
 *   real user     → { isDemo: false }             (never any demo rows)
 */
export function demoWhere(scope: DemoScope) {
  return scope.demo
    ? { isDemo: true, sessionId: scope.sessionId }
    : { isDemo: false };
}

export default demoWhere;