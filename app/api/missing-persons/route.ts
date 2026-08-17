import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { demoWhere, resolveDemoScope } from "@/lib/demo/scope";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scope = resolveDemoScope();
    const persons = await prisma.missingPerson.findMany({
      where: demoWhere(scope),
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ ok: true, persons });
  } catch (error) {
    console.error("Failed to load missing persons:", error);
    return NextResponse.json({ ok: true, persons: [], source: "mock" });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.name || !body.contactName || !body.contactPhone) {
    return NextResponse.json(
      { ok: false, error: "name, contactName, and contactPhone are required." },
      { status: 400 },
    );
  }

  try {
    const scope = resolveDemoScope();
    const person = await prisma.missingPerson.create({
      data: {
        name: String(body.name),
        age: body.age != null ? Number(body.age) : null,
        gender: typeof body.gender === "string" ? body.gender : null,
        description: typeof body.description === "string" ? body.description : null,
        lastKnownArea: typeof body.lastKnownArea === "string" ? body.lastKnownArea : null,
        lastSeenAt: typeof body.lastSeenAt === "string" ? new Date(body.lastSeenAt) : null,
        contactName: String(body.contactName),
        contactPhone: String(body.contactPhone),
        contactRelation: typeof body.contactRelation === "string" ? body.contactRelation : null,
        district: typeof body.district === "string" ? body.district : null,
        lat: body.lat != null ? Number(body.lat) : null,
        lng: body.lng != null ? Number(body.lng) : null,
        notes: typeof body.notes === "string" ? body.notes : null,
        status: "missing",
        isDemo: scope.demo,
        sessionId: scope.demo ? scope.sessionId : null,
      },
    });
    return NextResponse.json({ ok: true, person });
  } catch (error) {
    console.error("Failed to create missing person:", error);
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
    const person = await prisma.missingPerson.update({
      where: { id },
      data: {
        ...(typeof body.status === "string" ? { status: body.status } : {}),
        ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
      },
    });
    return NextResponse.json({ ok: true, person });
  } catch (error) {
    console.error("Failed to update missing person:", error);
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}
