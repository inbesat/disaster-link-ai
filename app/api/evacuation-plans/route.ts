import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

/** List evacuation plans, most recently created first. */
export async function GET() {
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
  } catch (error) {
    console.error("Failed to load evacuation plans:", error);
    return NextResponse.json(
      { ok: false, plans: [], error: "Failed to load." },
      { status: 500 },
    );
  }
}

/**
 * Persist an evacuation plan produced by the Mass Evacuation Planner so it
 * survives refresh and can be reviewed in the /evacuations tracker.
 */
export async function POST(request: NextRequest) {
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
  } catch (error) {
    console.error("Failed to create evacuation plan:", error);
    return NextResponse.json(
      { ok: false, error: "Could not save plan." },
      { status: 500 },
    );
  }
}
