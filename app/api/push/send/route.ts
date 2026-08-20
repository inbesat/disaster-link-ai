import { NextRequest, NextResponse } from "next/server";
import { notifyAllSubscribers } from "@/server/services/push-notifier";
import { requireRole } from "@/lib/security/require-role";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

/**
 * POST /api/push/send
 * Broadcast a push to every registered subscription. Used by the alert
 * engine's push channel and by the demo Alert Simulator. Body (all optional):
 *   { title, body, url, tag }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { title?: unknown; body?: unknown; url?: unknown; tag?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // optional body — proceed with defaults
  }

  const result = await notifyAllSubscribers({
    title: typeof body.title === "string" ? body.title : undefined,
    body: typeof body.body === "string" ? body.body : undefined,
    url: typeof body.url === "string" ? body.url : undefined,
    tag: typeof body.tag === "string" ? body.tag : undefined,
  });

  return NextResponse.json(result);
}
