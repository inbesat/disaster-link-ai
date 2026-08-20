import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/server/prisma";
import { PUBLIC_SHELTERS_CACHE_TAG } from "@/lib/cache-tags";
import { requireRole } from "@/lib/security/require-role";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

/** Replay endpoint for the field-offline sync queue (shelter occupancy writes). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  let body: { shelterId?: unknown; occupancy?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const shelterId = String(body.shelterId ?? "");
  const newOccupancy = Number(body.occupancy);
  if (!shelterId || !Number.isFinite(newOccupancy)) {
    return NextResponse.json(
      { ok: false, error: "shelterId and occupancy are required." },
      { status: 400 },
    );
  }

  try {
    const shelter = await prisma.shelter.findUnique({ where: { id: shelterId } });
    if (!shelter) {
      return NextResponse.json(
        { ok: false, error: "Shelter not found." },
        { status: 404 },
      );
    }

    const occupancy = Math.max(0, newOccupancy);
    let status = shelter.status;
    if (occupancy >= shelter.capacity) status = "full";
    else if (shelter.status === "full") status = "open";

    const updated = await prisma.shelter.update({
      where: { id: shelterId },
      data: { currentOccupancy: occupancy, status },
    });

    revalidatePath("/shelters");
    revalidatePath("/dashboard");
    // Step 8 · cache invalidation pipeline: this replay endpoint is the
    // field-offline sync path for shelter writes — purge the Public
    // endpoint's cached list too so offline updates reach the Citizen App.
    revalidateTag(PUBLIC_SHELTERS_CACHE_TAG);
    return NextResponse.json({ ok: true, shelter: updated });
  } catch (error: unknown) {
    console.error("Failed to sync shelter occupancy:", error);
    return NextResponse.json({ ok: false, error: "Failed to sync." }, { status: 500 });
  }
}
