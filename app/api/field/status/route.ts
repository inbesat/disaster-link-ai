import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/field/status
 * Mock command-center ingest for one-tap tactical status updates
 * (Phase 14 · Step 4). Echoes the update back so the client can confirm
 * delivery; a real build would persist to `field_status_updates` and fan
 * out to the situation room. Also the replay endpoint for the offline
 * sync queue — accepts the same body.
 *
 * Body: { status, emoji?, responder, lat, lng, at }
 */
export async function POST(request: NextRequest) {
  let body: {
    status?: unknown;
    emoji?: unknown;
    responder?: unknown;
    lat?: unknown;
    lng?: unknown;
    at?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const status = String(body.status ?? "").trim();
  if (!status) {
    return NextResponse.json(
      { ok: false, error: "status is required." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    ack: "command-center-ack",
    received: {
      status,
      emoji: typeof body.emoji === "string" ? body.emoji : undefined,
      responder: typeof body.responder === "string" ? body.responder : "unknown",
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      at: typeof body.at === "string" ? body.at : new Date().toISOString(),
    },
    loggedAt: new Date().toISOString(),
  });
}
