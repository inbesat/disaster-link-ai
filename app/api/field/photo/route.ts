import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Stand-in for the Supabase Storage upload path. During the hackathon demo this
// accepts the report metadata and returns 200 to simulate a successful upload;
// if the fetch fails (or the device is offline), the client falls back to
// queuing the base64 report locally in the offline report queue.
export async function POST(req: Request) {
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