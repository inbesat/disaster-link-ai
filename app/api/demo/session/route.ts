import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/demo/session
 * Presentation-mode session helper (Phase 15 · Step 2).
 *
 * The /demo split-screen embeds BOTH the citizen app (/public/dashboard)
 * and the gov Command Center (/gov/dashboard) as same-origin iframes —
 * they share this browser's cookies, so a single inconsistent session
 * would make the middleware's dual-mode crossover guards bounce one of
 * them (e.g. a gov role cookie redirects /public/* back to /gov/*).
 *
 * This endpoint normalises the browser to the one identity under which
 * BOTH dashboards render: guest mode with no role cookie. It mirrors the
 * cookie options used by setGuestCookie in app/actions/auth.ts.
 */
export async function GET() {
  const response = NextResponse.json({ ok: true, mode: "demo-guest" });

  response.cookies.set("guest_mode", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7-day demo session
  });

  // Drop identity cookies so the crossover guards can't redirect either
  // embedded dashboard (role=public bounces /gov/*, role=gov bounces
  // /public/*, view_as_public alters the public header).
  response.cookies.delete("role");
  response.cookies.delete("view_as_public");

  return response;
}
