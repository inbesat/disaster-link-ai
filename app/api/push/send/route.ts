import { NextRequest, NextResponse } from "next/server";
import { notifyAllSubscribers } from "@/server/services/push-notifier";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/send
 * Broadcast a push to every registered subscription. Used by the alert
 * engine's push channel and by the demo Alert Simulator. Body (all optional):
 *   { title, body, url, tag }
 */
export async function POST(request: NextRequest) {
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
