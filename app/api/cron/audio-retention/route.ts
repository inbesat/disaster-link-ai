import { NextRequest, NextResponse } from "next/server";
import { pruneExpiredAlertAudio } from "@/lib/tts/audio-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/audio-retention
 * Phase 8 · compliance retention — auto-deletes alert-audio files older
 * than 90 days (configurable via ?days=). Guarded by the shared
 * CRON_SECRET bearer token, same as /api/cron/ingest. ?dryRun=true lists
 * without deleting (safe to rehearse).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.startsWith("<")) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured — retention disabled." },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 90, 1), 3650);
  const dryRun = searchParams.get("dryRun") === "true";

  const result = await pruneExpiredAlertAudio({ maxAgeDays: days, dryRun });

  return NextResponse.json({ ok: true, maxAgeDays: days, ...result });
}
