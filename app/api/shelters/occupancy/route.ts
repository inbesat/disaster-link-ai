import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

/** Replay endpoint for the field-offline sync queue (shelter occupancy writes). */
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ ok: false, error: "Shelter not found." }, { status: 404 });
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
    return NextResponse.json({ ok: true, shelter: updated });
  } catch (error) {
    console.error("Failed to sync shelter occupancy:", error);
    return NextResponse.json({ ok: false, error: "Failed to sync." }, { status: 500 });
  }
}