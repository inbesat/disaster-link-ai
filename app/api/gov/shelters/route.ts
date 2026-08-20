// ---------------------------------------------------------------------
// app/api/gov/shelters/route.ts — Step 7 · Government API Endpoint
// (Real-Time & Full Data)
//
// The secure, uncached shelter feed for the Command Center.
//   • requireRole(GOV_ROLES) blocks the public/guest caller outright
//     (401/403).
//   • Rate limited to the caller's gov tier (admin 300 / responder 100
//     req/min per IP).
//   • Returns the FULL shelter rows — no scrubbing; gov-only columns are
//     the whole point for the Command Center.
//   • force-dynamic: never cached, so occupancy updates appear instantly.
// ---------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { clientIpFromRequest, rateLimitByRole } from "@/lib/security/rate-limiter";
import { GOV_ROLES } from "@/lib/validations/user";

/** Command Centers need real-time data — never cache this route. */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Step 7 · block public access before doing any work.
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  // Step 5 · role-based rate limiting — the resolved gov tier, keyed by IP.
  const ip = clientIpFromRequest(request);
  const rate = rateLimitByRole(auth.role, ip);
  if (!rate.success) {
    const retryAfterMs = Math.max(0, rate.resetTime - Date.now());
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded. Please try again shortly.", rate },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  try {
    // Full rows, unsanitized — the Command Center sees everything.
    const shelters = await prisma.shelter.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, shelters });
  } catch (error: unknown) {
    console.error("[gov/shelters] failed to load shelters:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load shelters." },
      { status: 500 },
    );
  }
}
