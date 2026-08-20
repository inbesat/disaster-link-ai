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

export async function GET(): Promise<NextResponse> {
  try {
    const scope = resolveDemoScope();
    const records = await prisma.casualtyRecord.findMany({
      where: demoWhere(scope),
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ ok: true, records });
  } catch (error: unknown) {
    console.error("Failed to load casualty records:", error);
    return NextResponse.json({ ok: true, records: [], source: "mock" });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Security: triage/casualty records mutate the ops picture. Citizens and
  // demo guests may report (requireSession), anonymous callers are blocked,
  // and the write is rate-limited to stop DB flooding.
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const budget = rateLimit(`casualties:post:${clientIp(request)}`, 10, 60_000);
  if (!budget.success) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

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

  const text = (value: unknown, max: number): string | null => {
    if (typeof value !== "string") return null;
    return sanitizeInput(value).slice(0, max) || null;
  };

  try {
    const scope = resolveDemoScope();
    const record = await prisma.casualtyRecord.create({
      data: {
        name: text(body.name, 200),
        age: body.age != null ? Number(body.age) : null,
        gender: typeof body.gender === "string" ? sanitizeInput(body.gender).slice(0, 50) : null,
        injuryType: text(body.injuryType, 200) ?? "unknown",
        severity: typeof body.severity === "string" ? sanitizeInput(body.severity).slice(0, 50) : "minor",
        description: text(body.description, 2000),
        locationName: text(body.locationName, 500),
        lat: body.lat != null ? Number(body.lat) : null,
        lng: body.lng != null ? Number(body.lng) : null,
        district: text(body.district, 200),
        status: typeof body.status === "string" ? sanitizeInput(body.status).slice(0, 50) : "active",
        isDemo: scope.demo,
        sessionId: scope.demo ? scope.sessionId : null,
      },
    });
    return NextResponse.json({ ok: true, record });
  } catch (error: unknown) {
    console.error("Failed to create casualty record:", error);
    return NextResponse.json({ ok: false, error: "Failed to save." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  // Security: updating severity/status/notes on casualty records is a
  // gov/responder action. Anonymous callers must never edit the registry.
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
    const record = await prisma.casualtyRecord.update({
      where: { id },
      data: {
        ...(typeof body.status === "string" ? { status: sanitizeInput(body.status).slice(0, 50) } : {}),
        ...(typeof body.severity === "string" ? { severity: sanitizeInput(body.severity).slice(0, 50) } : {}),
        ...(typeof body.notes === "string" ? { notes: sanitizeInput(body.notes).slice(0, 2000) } : {}),
      },
    });
    return NextResponse.json({ ok: true, record });
  } catch (error: unknown) {
    console.error("Failed to update casualty record:", error);
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}
