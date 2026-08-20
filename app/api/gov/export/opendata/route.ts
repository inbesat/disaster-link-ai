// ---------------------------------------------------------------------
// app/api/gov/export/opendata/route.ts — Step 10 · Open Data Export
// (GeoJSON)
//
// The government shares public disaster data with external NGOs as a
// downloadable GeoJSON file.
//   • requireRole(ADMIN_ROLES) — only district_admin / super_admin.
//   • Fetches ALL shelters + active (unacknowledged) alerts.
//   • Passes both through the privacy scrubber FIRST — NGOs must never see
//     gov-only columns (contact person, phone, operational notes, ML
//     payloads, internal delivery stats).
//   • Emits a valid GeoJSON FeatureCollection with the exact
//     Content-Type / Content-Disposition the spec requires.
// ---------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { clientIpFromRequest, rateLimitByRole } from "@/lib/security/rate-limiter";
import {
  sanitizeAlertForPublic,
  sanitizeShelterForPublic,
} from "@/lib/security/sanitize";
import { buildOpenDataFeatureCollection } from "@/lib/map/opendata-geojson";
import { ADMIN_ROLES } from "@/lib/validations/user";

/** Live data — exports must reflect the current situation, never a cache. */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Admin-only: open-data exports are a privileged gov operation.
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  // Admin-tier rate limit, keyed by client IP.
  const rate = rateLimitByRole(auth.role, clientIpFromRequest(request));
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
    const [shelters, alerts] = await Promise.all([
      prisma.shelter.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.alertLog.findMany({
        where: { isAcknowledged: false }, // "active" = unacknowledged, same as the dashboard badge
        orderBy: { sentAt: "desc" },
      }),
    ]);

    // Scrub BEFORE export — NGOs get the public-safe fields only.
    const featureCollection = buildOpenDataFeatureCollection(
      shelters.map(sanitizeShelterForPublic),
      alerts.map(sanitizeAlertForPublic),
    );

    return new NextResponse(JSON.stringify(featureCollection, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/geo+json",
        "Content-Disposition": 'attachment; filename="disaster_open_data.geojson"',
      },
    });
  } catch (error: unknown) {
    console.error("[gov/export/opendata] failed to build export:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to build the open-data export." },
      { status: 500 },
    );
  }
}
