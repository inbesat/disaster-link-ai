import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/sandbox
 * The Judges' Sandbox Link (Phase 15 · Step 4).
 *
 * A password-free, read-only citizen session for judges to click around
 * safely. Visiting this URL sets a short-lived `sandbox=true` cookie and
 * redirects straight into the Citizen app dashboard.
 *
 * The middleware treats `sandbox=true` as a Public Citizen identity:
 *   • non-citizen surfaces (gov, admin, field, settings…) redirect to
 *     /public/dashboard
 *   • every POST is intercepted and answered with a mock success payload
 *     — forms "work" (toast + no-op) but nothing is ever persisted.
 *
 * The cookie mirrors the demo guest cookie options (httpOnly, lax,
 * path=/, 24h TTL).
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/public/dashboard", request.url),
    302,
  );

  response.cookies.set("sandbox", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h sandbox session
  });

  return response;
}
