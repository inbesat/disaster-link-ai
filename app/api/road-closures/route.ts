import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

/** Load active road closures (used by the map to draw blockers). */
export async function GET() {
  try {
    const closures = await prisma.roadClosure.findMany({
      where: { isActive: true },
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
    const closure = await prisma.roadClosure.create({
      data: {
        lat,
        lng,
        reason: typeof body.reason === "string" ? body.reason : "Flooded road",
        isActive: true,
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
