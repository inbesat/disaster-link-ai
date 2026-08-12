import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import {
  autoApproveExpired,
  serializeApproval,
} from "@/lib/broadcast/auto-trigger";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

/**
 * GET /api/broadcast/fm/approvals
 * The pending-broadcast approval queue (Phase 7 HITL). Requests past their
 * auto-approval window are approved + dispatched first (lazy), then the
 * remaining pending requests are returned, newest first.
 */
export async function GET() {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Lazily auto-approve requests past their window (3 minutes by default).
    const autoApproved = await autoApproveExpired();

    const pending = await prisma.fmApprovalRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      approvals: pending.map((row) => serializeApproval(row)),
      autoApproved,
    });
  } catch (error) {
    console.error("Failed to list FM approvals:", error);
    return NextResponse.json({ ok: true, approvals: [], autoApproved: [] });
  }
}
