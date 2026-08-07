import { NextRequest, NextResponse } from "next/server";
import { createInitialState, type EmergencyGraphInput } from "@/lib/agents/graph-state";
import { getEmergencyGraph, foldFinalState } from "@/lib/agents/graph";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------
// app/api/agents/orchestrate/route.ts
// POST endpoint for the multi-agent graph:
//   START → predictorNode → plannerNode → allocatorNode → END
// The graph intentionally stops at `pending_approval` (Human-in-the-Loop). The
// `communicatorNode` is invoked separately once a commander approves.
// ---------------------------------------------------------------------

export async function POST(request: NextRequest) {
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
