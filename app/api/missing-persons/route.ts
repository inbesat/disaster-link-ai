import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole, requireSession } from "@/lib/security/require-role";
import { GOV_ROLES } from "@/lib/validations/user";
import { sanitizeInput } from "@/lib/security/sanitize";
import { rateLimit } from "@/lib/security/rate-limit";
import { demoWhere, resolveDemoScope } from "@/lib/demo/scope";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

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
  // Security: reporting a missing person mutates the registry. Citizens and
  // demo guests may report (requireSession admits role cookies + guest_mode),
  // but a fully anonymous caller is blocked and the write is rate-limited.
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const budget = rateLimit(`missing-persons:post:${clientIp(request)}`, 10, 60_000);
  if (!budget.success) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

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

  const text = (value: unknown, max: number): string | null => {
    if (typeof value !== "string") return null;
    return sanitizeInput(value).slice(0, max) || null;
  };

  try {
    const scope = resolveDemoScope();
    const person = await prisma.missingPerson.create({
      data: {
        name: text(body.name, 200) ?? "",
        age: body.age != null ? Number(body.age) : null,
        gender: typeof body.gender === "string" ? sanitizeInput(body.gender).slice(0, 50) : null,
        description: text(body.description, 2000),
        lastKnownArea: text(body.lastKnownArea, 500),
        lastSeenAt: typeof body.lastSeenAt === "string" ? new Date(body.lastSeenAt) : null,
        contactName: text(body.contactName, 200) ?? "",
        contactPhone: typeof body.contactPhone === "string" ? sanitizeInput(body.contactPhone).slice(0, 30) : "",
        contactRelation: text(body.contactRelation, 100),
        district: text(body.district, 200),
        lat: body.lat != null ? Number(body.lat) : null,
        lng: body.lng != null ? Number(body.lng) : null,
        notes: text(body.notes, 2000),
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
  // Security: flipping a person to "found"/"safe" (and editing notes) is a
  // gov/responder action — the citizen report form only POSTs. Guard it.
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

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
        ...(typeof body.status === "string" ? { status: sanitizeInput(body.status).slice(0, 50) } : {}),
        ...(typeof body.notes === "string" ? { notes: sanitizeInput(body.notes).slice(0, 2000) } : {}),
      },
    });
    return NextResponse.json({ ok: true, person });
  } catch (error) {
    console.error("Failed to update missing person:", error);
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}
