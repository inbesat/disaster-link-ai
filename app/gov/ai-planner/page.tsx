import PlannerLayout from "@/components/gov/ai/PlannerLayout";
import PlannerChat from "@/components/gov/ai/PlannerChat";
import OrchestrationFlow from "@/components/gov/ai/OrchestrationFlow";
import WhatIfSimulator from "@/components/gov/ai/WhatIfSimulator";
import PlanVisualizer from "@/components/gov/ai/PlanVisualizer";
import PlanApprovalBar from "@/components/gov/ai/PlanApprovalBar";

// ---------------------------------------------------------------------
// app/gov/ai-planner/page.tsx — Phase 9 · Step 1–4 · Gov AI Emergency
// Planner route.
//
// Composes the split-pane workspace shell (PlannerLayout):
//   • Left pane (35%)  → PlannerChat — the tool-calling AI commander
//     thread (suggested tool prompts, "Querying Database…" mock flow,
//     sticky composer with voice-input button).
//   • Right pane (65%) → OrchestrationFlow (the live swarm pipeline:
//     FloodPredictor → EvacuationPlanner → ResourceAllocator → Validator
//     → CommunicationsAgent, with a "Generate Plan" simulation) and the
//     WhatIfSimulator (stress-test sliders + "Re-run AI Planner", which
//     re-triggers the pipeline and shows a Delta Alert), above
//     PlanVisualizer (the military 4-step Field Operation Order —
//     ALERT / EVACUATE / RESOURCES / MONITOR) and the HITL
//     PlanApprovalBar (Pending Approval → Approve & Execute / Request
//     Changes).
//
// Like /gov/map, this route lives OUTSIDE the DashboardShell layouts so
// the workspace owns the full viewport; /gov/* crossover guards in
// middleware.ts protect it. The full MapLibre canvas (GovMapWorkspace)
// lands in the right pane in a later Phase 9 step.
// ---------------------------------------------------------------------

/** Right pane — swarm pipeline + what-if simulator + plan + HITL bar. */
function PlanPane() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <OrchestrationFlow />
      <WhatIfSimulator />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PlanVisualizer />
        <PlanApprovalBar />
      </div>
    </div>
  );
}

export default function GovAiPlannerPage() {
  return <PlannerLayout chat={<PlannerChat />} plan={<PlanPane />} />;
}
