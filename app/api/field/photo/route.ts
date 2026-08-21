import { NextResponse } from "next/server";
import { requireRole } from "@/lib/security/require-role";
import { GOV_ROLES } from "@/lib/validations/user";

export const runtime = "nodejs";

// Stand-in for the Supabase Storage upload path. During the hackathon demo this
// accepts the report metadata and returns 200 to simulate a successful upload;
// if the fetch fails (or the device is offline), the client falls back to
// queuing the base64 report locally in the offline report queue.
export async function POST(req: Request): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      severity?: string;
      lat?: number;
      lng?: number;
      at?: string;
    };
    // Sanitize the filename to prevent path traversal attacks
    const rawName = body.name ?? "anonymous";
    const safeName = rawName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/\.{2,}/g, "_")
      .slice(0, 100);
    return NextResponse.json({
      ok: true,
      path: `reports/${safeName || "anonymous"}.jpg`,
      severity: body.severity ?? null,
      coords: [body.lat, body.lng],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
}