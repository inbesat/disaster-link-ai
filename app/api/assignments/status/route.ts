import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VALID_STATUS = ["Not Started", "En Route", "Completed"] as const;

/**
 * Replay endpoint for the field-offline sync queue: accepts assignment status
 * updates queued while a responder was offline. Best-effort/ACK for the demo —
 * swap in a real `field_tasks` persistence layer as needed.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { id?: unknown; status?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const id = String(body.id ?? "");
  const status = String(body.status ?? "");
  if (!id || !(VALID_STATUS as readonly string[]).includes(status)) {
    return NextResponse.json(
      { ok: false, error: "id and a valid status are required." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    assignment: { id, status },
  });
}