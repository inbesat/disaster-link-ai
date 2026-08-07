import type { EmergencyState } from "@/lib/agents/graph-state";

// ---------------------------------------------------------------------
// lib/agents/nodes/intelligence-nodes.ts
// First two specialized agents in the response graph.
//
//   predictorNode — assesses the risk from the raw incident details.
//   plannerNode   — drafts a 48h evacuation plan once risk is known.
//
// Both are deliberately deterministic (hackathon-friendly) and include a mock
// processing delay so the streamed UI animation reads as realistic. They
// return partial state; the graph's reducers merge the `logs` array and take
// the last-writer-wins for scalar fields.
// ---------------------------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Deterministic keyword sniff used to pick a risk level from free-text
// incident details, so the demo is repeatable regardless of exact phrasing.
function assessRisk(incidentText: string): { level: string; keyword: string } {
  const text = (incidentText ?? "").toLowerCase();
  if (/(critical|catastroph|severe|evacuate|breach|collapse)/.test(text)) {
    return { level: "CRITICAL", keyword: "critical" };
  }
  if (/(heavy rain|flood|overflow|high)/.test(text)) {
    return { level: "HIGH", keyword: "high" };
  }
  if (/(watch|monitor|possible|rising)/.test(text)) {
    return { level: "WATCH", keyword: "watch" };
  }
  return { level: "HIGH", keyword: "high" };
}

/**
 * Predictor Agent — reads `incidentDetails`, assesses the risk level and
 * advances the graph to the `planning` stage. `predictorSensitivity` biases
 * ambiguous reports: a high sensitivity escalates monitoring→warning, while
 * a low sensitivity refuses to over-escalate weak evidence.
 */
export async function predictorNode(
  state: EmergencyState,
): Promise<Partial<EmergencyState>> {
  const sleepMs = 1200;
  await sleep(sleepMs);

  const sensitivity = Math.max(0, Math.min(100, state.predictorSensitivity || 75));
  let { level } = assessRisk(state.incidentDetails);

  // Sensitivity tuning: strong reports shouldn't be downgraded; weak signals
  // shouldn't be over-escalated unless sensitivity is high.
  if (level === "WATCH" && sensitivity >= 80) {
    level = "HIGH";
  } else if (level === "HIGH" && sensitivity <= 30) {
    level = "WATCH";
  }

  const log = `Predictor Agent: Analyzing weather and topographical data... Risk assessed as ${level} (sensitivity ${sensitivity}%)`;

  return {
    riskLevel: level,
    status: "planning",
    logs: [log],
  };
}

/**
 * Planner Agent — reads the assessed `riskLevel`, drafts a 48-hour evacuation
 * route for high-risk zones and advances the graph to the `allocating` stage.
 */
export async function plannerNode(
  state: EmergencyState,
): Promise<Partial<EmergencyState>> {
  const sleepMs = 1500;
  await sleep(sleepMs);

  const risk = state.riskLevel || "HIGH";
  const log = `Planner Agent: Drafting 48-hour evacuation route for ${risk}-risk zones...`;

  const evacuationPlan =
    risk === "CRITICAL"
      ? "CRITICAL EVACUATION PLAN — T+0h: activate all open shelters within 10km; " +
        "T+2h: deploy NDRF boats + convoy to riverside wards; " +
        "T+6h: begin staged movement of %AFFECTED_POP% residents; " +
        "T+24h: secure shelters and begin two-way flow from critical wards first."
      : "HIGH-RISK EVACUATION PLAN — T+0h: pre-position boats & secure 3 primary shelters; " +
        "T+6h: notify vulnerable blocks; " +
        "T+12h: staged evacuation of highest-severity wards; " +
        "T+24h: begin relocation, confirm shelter capacity via Command Center.";

  return {
    evacuationPlan,
    status: "allocating",
    logs: [log],
  };
}

// Export the mock delay helper so the shared UI can hint at per-node latency.
export const PREDICTOR_DELAY_MS = 1200;
export const PLANNER_DELAY_MS = 1500;