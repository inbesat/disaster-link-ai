import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

type Params = { params: { id: string } };

/**
 * Deactivate a road closure (road reopened). Keeps the row for audit but
 * marks is_active = false so the routing safety check ignores it.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
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
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
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
