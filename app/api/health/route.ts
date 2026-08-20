import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

// Never cache the health response — uptime monitors (Vercel Cron, UptimeRobot)
// must always hit a live check.
export const dynamic = "force-dynamic";

const VERSION = "1.0.0";

/**
 * GET /api/health — liveness probe for Vercel / UptimeRobot.
 *
 * Always answers 200 OK so infrastructure monitors treat the app as alive,
 * and includes a `db` field reflecting the last Prisma connectivity probe:
 *
 *   { "status": "healthy", "timestamp": "...", "version": "1.0.0", "db": "connected" }
 */
export async function GET(): Promise<NextResponse> {
  let db: "connected" | "disconnected" = "disconnected";

  try {
    // SELECT 1 — verifies DB reachability without depending on any model.
    await prisma.$queryRaw`SELECT 1`;
    db = "connected";
  } catch (error: unknown) {
    console.error("Health check: database connection failed:", error);
  }

  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: VERSION,
      db,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
