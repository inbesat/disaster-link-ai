import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { GOV_ROLES } from "@/lib/validations/user";
import { sanitizeInput } from "@/lib/security/sanitize";
import { demoWhere, resolveDemoScope } from "@/lib/demo/scope";

export const dynamic = "force-dynamic";

/** Load active road closures (used by the map to draw blockers). */
export async function GET() {
  try {
    // Phase 2 · Step 8 — session isolation: a demo session sees only its
    // own isDemo rows; a real user never sees any demo rows.
    const scope = resolveDemoScope();
    const closures = await prisma.roadClosure.findMany({
      where: { isActive: true, ...demoWhere(scope) },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, closures });
  } catch (error) {
    // Prisma can be unreachable on cold starts (e.g. Vercel). Never 500 —
    // serve an empty list so the map layer still renders.
    console.error("Failed to load road closures (serving empty list):", error);
    return NextResponse.json({ ok: true, closures: [], source: "mock" });
  }
}

/** Create a new road closure point placed by an admin on the map. */
export async function POST(request: NextRequest) {
  // Security: creating road-closure rows mutates the operational map layer.
  // GET stays public (the citizen map draws the blockers); writes are gov-only.
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { lat?: unknown; lng?: unknown; reason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { ok: false, error: "lat/lng are required." },
      { status: 400 },
    );
  }

  try {
    // Phase 2 · Step 8 — closures created from a demo session are tagged
    // demo rows owned by that session; they never leak into real views.
    const scope = resolveDemoScope();
    const closure = await prisma.roadClosure.create({
      data: {
        lat,
        lng,
        reason:
          typeof body.reason === "string"
            ? sanitizeInput(body.reason).slice(0, 500)
            : "Flooded road",
        isActive: true,
        isDemo: scope.demo,
        sessionId: scope.demo ? scope.sessionId : null,
      },
    });
    return NextResponse.json({ ok: true, closure });
  } catch (error) {
    console.error("Failed to create road closure:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create closure." },
      { status: 500 },
    );
  }
}
