import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { demoWhere, resolveDemoScope } from "@/lib/demo/scope";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scope = resolveDemoScope();
    const records = await prisma.casualtyRecord.findMany({
      where: demoWhere(scope),
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ ok: true, records });
  } catch (error) {
    console.error("Failed to load casualty records:", error);
    return NextResponse.json({ ok: true, records: [], source: "mock" });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.injuryType) {
    return NextResponse.json(
      { ok: false, error: "injuryType is required." },
      { status: 400 },
    );
  }

  try {
    const scope = resolveDemoScope();
    const record = await prisma.casualtyRecord.create({
      data: {
        name: typeof body.name === "string" ? body.name : null,
        age: body.age != null ? Number(body.age) : null,
        gender: typeof body.gender === "string" ? body.gender : null,
        injuryType: String(body.injuryType),
        severity: typeof body.severity === "string" ? body.severity : "minor",
        description: typeof body.description === "string" ? body.description : null,
        locationName: typeof body.locationName === "string" ? body.locationName : null,
        lat: body.lat != null ? Number(body.lat) : null,
        lng: body.lng != null ? Number(body.lng) : null,
        district: typeof body.district === "string" ? body.district : null,
        status: typeof body.status === "string" ? body.status : "active",
        isDemo: scope.demo,
        sessionId: scope.demo ? scope.sessionId : null,
      },
    });
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    console.error("Failed to create casualty record:", error);
    return NextResponse.json({ ok: false, error: "Failed to save." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const id = body.id as string | undefined;
  if (!id) {
    return NextResponse.json({ ok: false, error: "id is required." }, { status: 400 });
  }

  try {
    const record = await prisma.casualtyRecord.update({
      where: { id },
      data: {
        ...(typeof body.status === "string" ? { status: body.status } : {}),
        ...(typeof body.severity === "string" ? { severity: body.severity } : {}),
        ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
      },
    });
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    console.error("Failed to update casualty record:", error);
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}
