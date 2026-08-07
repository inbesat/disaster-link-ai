import type {
  EmergencyState,
  ResourceAllocation,
} from "@/lib/agents/graph-state";

// ---------------------------------------------------------------------
// lib/agents/nodes/action-nodes.ts
// Third + fourth agents in the response graph.
//
//   allocatorNode    — maps the drafted evacuation plan to concrete resource
//                      deployments, then pauses requesting human approval.
//   communicatorNode — fan-out stage: broadcasts alerts to responders and
//                      marks the incident resolved (run externally / manually
//                      once the human approves the allocation).
//
// Both use a mock processing delay to keep the streamed UI animation honest.
// ---------------------------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Allocator Agent — reads the evacuation plan and generates a concrete set of
 * resource allocations (boats, medical kits, water, transport). Respects the
 * "Resource Hoarding Limit" (max % of inventory usable without approval) and
 * compares demand against `availableInventory`.
 *
 * When demand exceeds what's available (after the hoarding cap), the Allocator
 * STOPS the graph: it sets `status: "conflict"` + a `conflict` message so the
 * pipeline halts and a manual command override is requested. Otherwise it ends
 * in `pending_approval`, leaving a Human-in-the-Loop pause.
 */
export async function allocatorNode(
  state: EmergencyState,
): Promise<Partial<EmergencyState>> {
  const sleepMs = 1800;
  await sleep(sleepMs);

  const risk = state.riskLevel || "HIGH";
  const hoardingLimit = Math.max(0, Math.min(100, state.hoardingLimitPercent ?? 100));
  const inventory = state.availableInventory ?? {};
  const hasInventory = Object.keys(inventory).length > 0;

  const boatCount = risk === "CRITICAL" ? 80 : risk === "HIGH" ? 50 : 20;

  // Proposed demand before any availability check.
  const requested: ResourceAllocation[] = [
    {
      resourceType: "NDRF Rescue Boats",
      quantity: boatCount,
      targetZone: "KatQ high-severity wards",
      eta: "T+2h",
    },
    {
      resourceType: "Medical First-Aid Kits",
      quantity: 200,
      targetZone: "Routing primary shelter",
      eta: "T+3h",
    },
    {
      resourceType: "Bottled Water Pallets",
      quantity: 150,
      targetZone: "Kankarbagh & Paras Primary Shelter",
      eta: "T+6h",
    },
    {
      resourceType: "Transport Buses",
      quantity: 12,
      targetZone: "Mass evacuation convoy",
      eta: "T+1h",
    },
  ];

  // Clamp each allocation to the hoarding-limit allowance; record deficits.
  const deficits: string[] = [];
  const resourceAllocations: ResourceAllocation[] = requested.map((alloc) => {
    const available = Number(inventory[alloc.resourceType]);
    if (Number.isNaN(available)) {
      // No inventory snapshot for this type → assume it's fully available.
      return alloc;
    }
    const allowance = Math.floor(available * (hoardingLimit / 100));
    if (allowance < alloc.quantity) {
      deficits.push(
        `${alloc.quantity} ${alloc.resourceType} needed but only ${allowance} available`,
      );
      return { ...alloc, quantity: Math.max(0, allowance) };
    }
    return alloc;
  });

  // CONFLICT — the pipeline must stop and ask for a manual override.
  if (deficits.length > 0) {
    const conflict =
      `Allocator Agent reports severe resource deficit: ${deficits.join("; ")}. ` +
      "Manual Command Override Required.";
    return {
      resourceAllocations,
      status: "conflict",
      conflict,
      logs: [conflict],
    };
  }

  const log =
    hasInventory
      ? `Allocator Agent: Assigning ${boatCount} NDRF boats and 200 medical kits (hoarding limit ${hoardingLimit}%)...`
      : "Allocator Agent: Assigning 50 NDRF boats and 200 medical kits to highest-severity zones...";

  return {
    resourceAllocations,
    status: "pending_approval",
    logs: [log],
  };
}

/**
 * Communicator Agent — broadcasts alerts (SMS to field responders, browser
 * push, control-room tickers / sirens) and closes the loop by moving the
 * incident to `resolved`. Helpful as the terminal step after approval.
 */
export async function communicatorNode(
  state: EmergencyState,
): Promise<Partial<EmergencyState>> {
  const sleepMs = 900;
  await sleep(sleepMs);

  const incidentHint = (state.incidentDetails ?? "").slice(0, 48) || "active incident";
  const log =
    `Communicator Agent: Broadcasting SMS alerts to field responders and activating sirens for "${incidentHint}"...`;

  return {
    status: "resolved",
    logs: [log],
  };
}

export const ALLOCATOR_DELAY_MS = 1800;
export const COMMUNICATOR_DELAY_MS = 900;