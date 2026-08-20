import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { serializeFmStation } from "@/lib/fm/serialize";

export const dynamic = "force-dynamic";

const WRITE_ROLES = ["super_admin", "district_admin"] as const;

type Params = { params: { id: string } };

/** Update an FM station (admin CRUD). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const auth = await requireRole(WRITE_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  for (const key of [
    "name",
    "frequency",
    "city",
    "state",
    "callSign",
    "operator",
    "type",
    "emergencyApiEndpoint",
    "emergencyContactPhone",
    "rdsApiEndpoint",
  ]) {
    if (key in body) data[key] = body[key];
  }
  if (typeof body.coverageRadiusKm === "number" && Number.isFinite(body.coverageRadiusKm)) {
    data.coverageRadiusKm = body.coverageRadiusKm;
  }
  if (typeof body.rdsEnabled === "boolean") data.rdsEnabled = body.rdsEnabled;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.lat === "number" && Number.isFinite(body.lat)) data.lat = body.lat;
  if (typeof body.lng === "number" && Number.isFinite(body.lng)) data.lng = body.lng;

  try {
    const station = await prisma.fmStation.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ ok: true, station: serializeFmStation(station) });
  } catch (error: unknown) {
    console.error("Failed to update FM station:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update FM station." },
      { status: 404 },
    );
  }
}

/** Delete an FM station (admin CRUD). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const auth = await requireRole(WRITE_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await prisma.fmStation.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Failed to delete FM station:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete FM station." },
      { status: 404 },
    );
  }
}
