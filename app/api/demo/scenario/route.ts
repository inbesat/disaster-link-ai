import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/server/prisma";
import { PUBLIC_SHELTERS_CACHE_TAG } from "@/lib/cache-tags";
import { resolveDemoScope } from "@/lib/demo/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/demo/scenario
 * Mock server-action hub for the invisible demo hotkeys (Phase 15 · Step 3)
 * and the God-Mode one-click panel (Phase 2 · Step 7).
 * Each action mutates the demo DB when reachable, and gracefully falls
 * back to a mock ACK so the pitch never dead-ends on a dead database.
 *
 * Actions:
 *   • "shelter-full"      — flips the demo shelter (Central Community Hall)
 *                           to FULL (occupancy = capacity).
 *   • "responder-arrival" — simulates a field responder arriving on-scene.
 *   • "resource-deploy"   — simulates deploying a resource to the flood zone.
 *   • "road-close"        — simulates closing a flood-hit road.
 *   • "reset"             — wipes + reseeds THIS session's hero scenario
 *                           (resetDemoScenario(), same data as
 *                           `npm run demo:reset`), tagged with the current
 *                           demo_session_id so Step 8 isolation holds.
 *
 * Body: { action: string }
 */
export async function POST(request: NextRequest) {
  let body: { action?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const action = String(body.action ?? "").trim();
  // Phase 2 · Step 8 — every mutation/query below scopes to the caller's
  // demo session so demo rows are owned by exactly one session.
  const scope = resolveDemoScope();

  switch (action) {
    case "shelter-full": {
      try {
        const shelter = await prisma.shelter.findFirst({
          where: {
            name: "Central Community Hall",
            ...(scope.demo ? { isDemo: true, sessionId: scope.sessionId } : {}),
          },
        });
        if (shelter) {
          await prisma.shelter.update({
            where: { id: shelter.id },
            data: { currentOccupancy: shelter.capacity, status: "full" },
          });
          revalidatePath("/shelters");
          revalidatePath("/dashboard");
          revalidateTag(PUBLIC_SHELTERS_CACHE_TAG);
          return NextResponse.json({
            ok: true,
            action,
            shelterId: shelter.id,
            name: shelter.name,
            status: "full",
          });
        }
        return NextResponse.json({
          ok: true,
          action,
          mock: true,
          message: "Demo shelter not in DB — simulated FULL.",
        });
      } catch (error) {
        console.warn("[demo/scenario] shelter-full failed, simulating:", error);
        return NextResponse.json({
          ok: true,
          action,
          mock: true,
          message: "Shelter marked FULL (simulated — DB offline).",
        });
      }
    }

    case "responder-arrival": {
      return NextResponse.json({
        ok: true,
        action,
        responder: "Sunita Das · Team Alpha",
        status: "Arrived at Location",
        lat: 25.5989,
        lng: 85.1492,
        at: new Date().toISOString(),
      });
    }

    case "resource-deploy": {
      return NextResponse.json({
        ok: true,
        action,
        resource: "NDRF Rescue Boats",
        quantity: 4,
        destination: "Rajendra Nagar flood zone",
        status: "dispatched",
        etaHrs: 1.5,
        at: new Date().toISOString(),
      });
    }

    case "road-close": {
      return NextResponse.json({
        ok: true,
        action,
        road: "Ashok Rajpath (Gandhi Maidan ↔ Patna City)",
        status: "closed",
        reason: "Waterlogging reported by field team",
        at: new Date().toISOString(),
      });
    }

    case "reset": {
      try {
        const { resetDemoScenario } = await import("@/lib/demo/reset-scenario");
        const result = await resetDemoScenario({ sessionId: scope.demo ? scope.sessionId : null });
        return NextResponse.json({ ok: true, action, reset: true, sessionId: scope.sessionId, ...result });
      } catch (error) {
        console.warn("[demo/scenario] reset failed, simulating:", error);
        return NextResponse.json({
          ok: true,
          action,
          reset: true,
          mock: true,
          message: "Scenario reset (simulated — DB offline).",
        });
      }
    }

    default:
      return NextResponse.json(
        { ok: false, error: `Unknown action "${action}".` },
        { status: 400 },
      );
  }
}
