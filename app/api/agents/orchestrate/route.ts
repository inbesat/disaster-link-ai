import { NextRequest, NextResponse } from "next/server";
import { createInitialState, type EmergencyGraphInput } from "@/lib/agents/graph-state";
import { getEmergencyGraph, foldFinalState } from "@/lib/agents/graph";
import { requireRole } from "@/lib/security/require-role";
import { createRateLimiter } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

// Rate limit: 3 orchestrations per minute per IP (expensive multi-agent graph)
const orchestrateLimiter = createRateLimiter(3, 60_000);

// ---------------------------------------------------------------------
// app/api/agents/orchestrate/route.ts
// POST endpoint for the multi-agent graph:
//   START → predictorNode → plannerNode → allocatorNode → END
// The graph intentionally stops at `pending_approval` (Human-in-the-Loop). The
// `communicatorNode` is invoked separately once a commander approves.
// ---------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Rate limit check
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
  const rateResult = orchestrateLimiter(`orchestrate:${ip}`);
  if (!rateResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)) } },
    );
  }

  let body: {
    incidentDetails?: string;
    incidentId?: string;
    availableInventory?: Record<string, number>;
    hoardingLimitPercent?: number;
    predictorSensitivity?: number;
  } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const incidentDetails = (body.incidentDetails ?? "").toString().trim();
  if (!incidentDetails) {
    return NextResponse.json(
      { ok: false, error: "incidentDetails is required." },
      { status: 400 },
    );
  }

  const incidentId = body.incidentId ?? `incident-${Date.now()}`;

  const graph = getEmergencyGraph();
  const input: EmergencyGraphInput = createInitialState(incidentDetails, {
    status: "predicting",
    ...(body.availableInventory ? { availableInventory: body.availableInventory } : {}),
    ...(body.hoardingLimitPercent ? { hoardingLimitPercent: body.hoardingLimitPercent } : {}),
    ...(body.predictorSensitivity ? { predictorSensitivity: body.predictorSensitivity } : {}),
  });

  // Stream per-node "updates" so the UI can replay each agent's contribution
  // and the reasoning logs append in real time.
  const steps: Array<{ node: string; update: Record<string, unknown> }> = [];
  const stream = await graph.stream(input, { recursionLimit: 10 });
  for await (const update of stream) {
    for (const [nodeName, value] of Object.entries(update)) {
      steps.push({ node: nodeName, update: (value ?? {}) as Record<string, unknown> });
    }
  }

  // Fold streamed updates into the authoritative final state.
  const finalState = foldFinalState(steps, incidentDetails);

  return NextResponse.json({
    ok: true,
    incidentId,
    finalState,
    steps,
    requiresApproval: finalState.status === "pending_approval",
    conflict: finalState.conflict ?? null,
    status: finalState.status,
  });
}
