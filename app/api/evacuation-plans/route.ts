import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

/** List evacuation plans, most recently created first. */
export async function GET(): Promise<NextResponse> {
  try {
    const plans = await prisma.evacuationPlan.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { shelter: { select: { id: true, name: true } } },
    });

    const enriched = plans.map((plan) => ({
      ...plan,
      shelterName: plan.shelter?.name ?? "Unknown shelter",
    }));

    return NextResponse.json({ ok: true, plans: enriched });
  } catch (error: unknown) {
    // Prisma can be unreachable on cold starts (e.g. Vercel). Never 500 —
    // serve an empty list (source: "mock") so the tracker still renders.
    console.error("Failed to load evacuation plans (serving empty list):", error);
    return NextResponse.json({ ok: true, plans: [], source: "mock" });
  }
}

/**
 * Persist an evacuation plan produced by the Mass Evacuation Planner so it
 * survives refresh and can be reviewed in the /evacuations tracker.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    villageName?: unknown;
    assignedShelterId?: unknown;
    estimatedEvacuees?: unknown;
    routeGeoJson?: unknown;
    status?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const villageName = typeof body.villageName === "string" ? body.villageName : null;
  const assignedShelterId =
    typeof body.assignedShelterId === "string" ? body.assignedShelterId : null;

  if (!villageName || !assignedShelterId) {
    return NextResponse.json(
      { ok: false, error: "villageName and assignedShelterId are required." },
      { status: 400 },
    );
  }

  try {
    const plan = await prisma.evacuationPlan.create({
      data: {
        villageName,
        assignedShelterId,
        shelterId: assignedShelterId,
        estimatedEvacuees: Math.max(0, Number(body.estimatedEvacuees) || 0),
        status: typeof body.status === "string" ? body.status : "pending",
        routeGeoJson:
          typeof body.routeGeoJson === "string" ? body.routeGeoJson : JSON.stringify({}),
      },
    });
    return NextResponse.json({ ok: true, plan });
  } catch (error: unknown) {
    console.error("Failed to create evacuation plan:", error);
    return NextResponse.json(
      { ok: false, error: "Could not save plan." },
      { status: 500 },
    );
  }
}
