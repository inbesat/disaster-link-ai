import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

/**
 * Deactivate a road closure (road reopened). Keeps the row for audit but
 * marks is_active = false so the routing safety check ignores it.
 */
export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const closure = await prisma.roadClosure.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true, closure });
  } catch (error) {
    console.error("Failed to resolve road closure:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to resolve closure." },
      { status: 404 },
    );
  }
}

/** Hard-delete a road closure. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await prisma.roadClosure.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete road closure:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete closure." },
      { status: 404 },
    );
  }
}
