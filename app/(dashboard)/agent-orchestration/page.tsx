"use client";

import { useState } from "react";
import { Loader2, Play, ChevronRight, Siren } from "lucide-react";
import toast from "react-hot-toast";
import AgentNode, {
  type AgentNodeProps,
} from "@/components/agents/AgentNode";
import DecisionLog from "@/components/agents/DecisionLog";
import ApprovalCheckpoint, {
  type ProposedAllocation,
} from "@/components/agents/ApprovalCheckpoint";
import AgentConfigPanel, {
  type AgentDirectives,
} from "@/components/agents/AgentConfigPanel";
import {
  PREDICTOR_DELAY_MS,
  PLANNER_DELAY_MS,
} from "@/lib/agents/nodes/intelligence-nodes";
import {
  ALLOCATOR_DELAY_MS,
  COMMUNICATOR_DELAY_MS,
} from "@/lib/agents/nodes/action-nodes";

type AgentStatus = AgentNodeProps["status"];

// The four agents in pipeline order, with attributes for the flow chart.
const WORKFLOW = [
  { name: "Predictor", role: "Risk Assessment", delay: PREDICTOR_DELAY_MS },
  { name: "Planner", role: "48h Evacuation Plan", delay: PLANNER_DELAY_MS },
  { name: "Allocator", role: "Resource Allocation", delay: ALLOCATOR_DELAY_MS },
  { name: "Communicator", role: "SMS / Siren Fan-out", delay: COMMUNICATOR_DELAY_MS },
] as const;

type FlowStatus = Record<string, AgentStatus>;

// Level-4 crisis scenario offered by the "Simulate" button.
const LEVEL4_SCENARIO =
  "CATASTROPHIC flood event: Ganga river bank breach at KatQ ward, 12,000 residents at risk, critical infrastructure flooding, grid down.";

const COMM_LOG = "Communicator Agent: Broadcasting SMS alerts to field responders and activating sirens...";

export default function AgentOrchestrationPage() {
  const [incident, setIncident] = useState(
    "Heavy rainfall, river overflowing near KatQ ward",
  );
  const [nodes, setNodes] = useState<FlowStatus>(() =>
    Object.fromEntries(WORKFLOW.map((w) => [w.name, "idle"])),
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [plan, setPlan] = useState("");
  const [riskLevel, setRiskLevel] = useState("HIGH");
  const [allocations, setAllocations] = useState<ProposedAllocation[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);
  const [directives, setDirectives] = useState<AgentDirectives>({
    predictorSensitivity: 75,
    hoardingLimitPercent: 100,
  });

  function resetState() {
    setResolved(false);
    setNeedsApproval(false);
    setAuthorizing(false);
    setConflict(null);
    setLogs([]);
    setPlan("");
    setAllocations([]);
    setNodes(Object.fromEntries(WORKFLOW.map((w) => [w.name, "idle"])));
  }

  async function runOrchestration(details: string) {
    if (!details.trim()) {
      toast.error("Describe the incident first.");
      return;
    }

    setRunning(true);
    resetState();

    try {
      const res = await fetch("/api/agents/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentDetails: details.trim(),
          availableInventory: {
            "NDRF Rescue Boats": 20,
            "Medical First-Aid Kits": 500,
            "Bottled Water Pallets": 300,
            "Transport Buses": 40,
          },
          predictorSensitivity: directives.predictorSensitivity,
          hoardingLimitPercent: directives.hoardingLimitPercent,
        }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        finalState: {
          riskLevel: string;
          evacuationPlan: string;
          resourceAllocations: ProposedAllocation[];
          logs: string[];
          status: string;
          conflict: string | null;
        };
        requiresApproval: boolean;
      };
      if (!payload.ok) throw new Error("Orchestration failed");

      // Replay agents light-up in order with realistic delays (Predictor →
      // Planner → Allocator). If the Allocator reported a conflict, the
      // pipeline halts there and a manual command override is requested.
      const steps = WORKFLOW.slice(0, 3);
      for (let i = 0; i < steps.length; i++) {
        setNodes((prev) => ({ ...prev, [steps[i].name]: "active" }));
        await sleep(600);
        setNodes((prev) => ({ ...prev, [steps[i].name]: "done" }));
        if (i < steps.length - 1) await sleep(420);
      }

      setLogs(payload.finalState.logs);
      setPlan(payload.finalState.evacuationPlan);
      setRiskLevel(payload.finalState.riskLevel);
      setAllocations(payload.finalState.resourceAllocations);

      if (payload.finalState.status === "conflict") {
        setConflict(payload.finalState.conflict);
        toast.error("Agent conflict detected — manual override required.");
      } else {
        setNeedsApproval(payload.requiresApproval);
      }
    } catch {
      toast.error("Could not reach the orchestration engine.");
    } finally {
      setRunning(false);
    }
  }

  async function approve() {
    // Human-in-the-Loop: authorizing hands off to the Communicator agent.
    setAuthorizing(true);
    setNeedsApproval(false);
    setNodes((prev) => ({ ...prev, Communicator: "active" }));
    await sleep(COMMUNICATOR_DELAY_MS);
    setNodes((prev) => ({ ...prev, Communicator: "done" }));
    setAuthorizing(false);
    setLogs((prev) => [...prev, COMM_LOG]);
    setResolved(true);
    toast.success("Deployment authorized — alerts broadcast.");
  }

  function rejectAndReplan() {
    resetState();
    toast.error("Plan rejected — pipeline reset for re-planning.");
  }

  function overrideConflict() {
    // Manual Command Override: commander accepts the shortfall and forces
    // the pipeline to continue to the Communicator fan-out.
    setConflict(null);
    setNeedsApproval(true);
    toast.success("Manual override accepted — proceed to approval.");
  }

  function simulateLevel4() {
    setIncident(LEVEL4_SCENARIO);
    void runOrchestration(LEVEL4_SCENARIO);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eoc-label text-accent">LANGGRAPH MULTI-AGENT · PHASE 16</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">
            Autonomous Response Orchestration
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Predict → Plan → Allocate → Communicate. Watch specialized agents
            reason about an incident end-to-end.
          </p>
        </div>

        {/* Top-right controls: simulate + run */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={running}
            onClick={simulateLevel4}
            className="flex items-center gap-2 rounded-lg border-2 border-severity-red-600 px-4 py-2.5 text-sm font-black uppercase tracking-wider text-severity-red-400 shadow-glow-red transition hover:bg-severity-red-600/10 active:scale-95 disabled:opacity-50"
          >
            <Siren className="h-4 w-4" aria-hidden />
            Simulate Level 4 Crisis
          </button>

          <button
            type="button"
            disabled={running}
            onClick={() => void runOrchestration(incident)}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-glow-accent transition hover:bg-sky-300 active:scale-95 disabled:opacity-50"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Orchestrating…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden />
                Run Orchestration
              </>
            )}
          </button>
        </div>
      </div>

      {/* Incident input */}
      <div className="mb-8 rounded-eoc border border-border bg-surface p-4">
        <label className="eoc-label mb-1.5">INCIDENT DETAILS</label>
        <textarea
          value={incident}
          onChange={(e) => setIncident(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-accent"
          placeholder="Describe the detected incident…"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workflow flow-chart */}
        <div className="rounded-eoc border border-border bg-surface p-6 lg:col-span-2">
          <p className="eoc-label mb-5 text-slate-400">AGENT PIPELINE</p>
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {WORKFLOW.map((agent, i) => (
              <div key={agent.name} className="flex flex-1 items-center">
                <AgentNode
                  name={agent.name}
                  role={agent.role}
                  status={nodes[agent.name]}
                />
                {i < WORKFLOW.length - 1 && (
                  <ChevronRight className="mx-1 h-5 w-5 shrink-0 text-slate-600" aria-hidden />
                )}
              </div>
            ))}
          </div>

          {/* Conflict banner — pipeline stopped, manual override required */}
          {conflict && (
            <div className="mt-6 rounded-eoc border-2 border-severity-red-600 bg-severity-red-600/10 p-4 shadow-glow-red animate-flash">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black tracking-widest text-severity-red-400">
                    MANUAL COMMAND OVERRIDE REQUIRED
                  </p>
                  <p className="mt-1 text-sm font-semibold text-severity-red-200">
                    {conflict}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={overrideConflict}
                  className="rounded-lg border border-severity-red-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-severity-red-300 transition hover:bg-severity-red-600/20 active:scale-95"
                >
                  Override & Continue
                </button>
              </div>
            </div>
          )}

          {/* Resolved badge */}
          {resolved && (
            <div className="mt-6 rounded-eoc border border-severity-green-600/50 bg-severity-green-600/10 p-4">
              <p className="text-sm font-bold text-severity-green-300">
                INCIDENT RESOLVED — alerts broadcast and deployment authorized.
              </p>
            </div>
          )}
        </div>

        {/* Agent tuning directives */}
        <AgentConfigPanel onSave={setDirectives} initial={directives} />
      </div>

      {/* Human-in-the-Loop approval checkpoint */}
      <ApprovalCheckpoint
        open={needsApproval}
        riskLevel={riskLevel}
        evacuationPlan={plan}
        resourceAllocations={allocations}
        authorizing={authorizing}
        onAuthorize={() => void approve()}
        onReject={rejectAndReplan}
      />

      {/* Chain of reasoning console */}
      <div className="mt-6">
        <p className="eoc-label mb-2 text-slate-400">CHAIN OF REASONING</p>
        <DecisionLog logs={logs} />
      </div>
    </div>
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));