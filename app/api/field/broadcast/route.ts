import { NextRequest, NextResponse } from "next/server";
import { notifyAllSubscribers } from "@/server/services/push-notifier";
import { requireRole } from "@/lib/security/require-role";
import { sanitizeInput } from "@/lib/security/sanitize";

export const runtime = "nodejs";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

export interface FieldBroadcast {
  id: string;
  title: string;
  message: string;
  sector: string;
  sentAt: string;
}

/**
 * In-memory store for the current active broadcast. In a real deployment this
 * would live in a `field_broadcasts` table; for the demo it lets the field
 * recall banner poll the latest dispatch across tabs/devices within the same
 * process. The legacy `DRIP_LAST_BROADCAST_ID` env-var read is kept as a
 * fallback so existing setups keep working.
 */
let activeBroadcast: FieldBroadcast | null = null;

const RECALL_TITLE = "EMERGENCY RECALL ORDER";
const RECALL_MESSAGE =
  "🛑 IMMEDIATE EVACUATION ORDER: Flash flood warning in your sector. Move to higher ground immediately.";
const RECALL_SECTOR = "Beta · Rajendra Nagar";

/**
 * POST /api/field/broadcast
 * Command-room dispatch of an emergency recall order. Stores the broadcast
 * (so the field recall banner picks it up on its next poll) and sends a Web
 * Push notification to every registered responder device — Phase 19 step 9.
 *
 * Body (all optional, defaults to the standard recall template):
 *   { title?, message?, sector? }
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { title?: unknown; message?: unknown; sector?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // Optional body — proceed with the standard recall template.
  }

  const broadcast: FieldBroadcast = {
    id: `recall-${Date.now()}`,
    title: typeof body.title === "string" && body.title ? body.title : RECALL_TITLE,
    message:
      typeof body.message === "string" && body.message ? body.message : RECALL_MESSAGE,
    sector: typeof body.sector === "string" && body.sector ? body.sector : RECALL_SECTOR,
    sentAt: new Date().toISOString(),
  };
  activeBroadcast = broadcast;

  // Fire the Web Push (graceful — skipped when VAPID is not configured).
  const push = await notifyAllSubscribers({
    title: broadcast.title,
    body: broadcast.message,
    url: "/field",
    tag: "drip-recall",
  });

  return NextResponse.json({
    ok: true,
    broadcast,
    push,
  });
}

/**
 * GET /api/field/broadcast
 * Polled by the field recall banner. Returns the most recent dispatched
 * broadcast, or `null` when the command room has nothing active.
 */
export async function GET() {
  if (activeBroadcast) {
    return NextResponse.json({
      broadcast: {
        ...activeBroadcast,
        title: sanitizeInput(activeBroadcast.title),
        message: sanitizeInput(activeBroadcast.message),
        sector: sanitizeInput(activeBroadcast.sector),
      },
      lastId: activeBroadcast.id,
    });
  }

  // Legacy fallback: an env-var-driven broadcast for externally provisioned setups.
  const lastId = process.env.DRIP_LAST_BROADCAST_ID ?? null;
  if (!lastId) {
    return NextResponse.json({ broadcast: null, lastId: null });
  }
  return NextResponse.json({
    broadcast: {
      id: lastId,
      title: RECALL_TITLE,
      message: RECALL_MESSAGE,
      sector: RECALL_SECTOR,
      sentAt: new Date().toISOString(),
    },
    lastId,
  });
}
