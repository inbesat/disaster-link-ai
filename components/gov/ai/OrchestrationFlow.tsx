"use client";

// ---------------------------------------------------------------------
// components/gov/ai/OrchestrationFlow.tsx — Phase 9 · Step 3 · Agent
// Orchestration Workflow Diagram.
//
// The swarm pipeline: FloodPredictor → EvacuationPlanner →
// ResourceAllocator → Validator → CommunicationsAgent, rendered as a
// horizontal row of AgentCards joined by animated marching-dash
// connectors (.flow-connector in globals.css).
//
// Simulation: "Generate Plan" runs the pipeline — every 2 seconds the
// next agent flips Thinking → Complete with its mock output, so the
// light cascades left→right. Re-running resets the cascade; timers are
// cleaned up on unmount / re-run. The What-If Simulator (Step 8) can
// also re-trigger the run by dispatching the PLANNER_RERUN_EVENT window
// event.
//
// Mounted at the top of the right pane (PlannerLayout's `plan` slot).
// ---------------------------------------------------------------------

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Play, Sparkles } from "lucide-react";
import AgentCard, { EMERGENCY_AGENTS, type AgentStatus } from "./AgentCard";

/** Window event the What-If Simulator dispatches to re-run the pipeline. */
export const PLANNER_RERUN_EVENT = "planner:rerun";

/** Mock one-liner each agent "produces" as it completes its turn. */
const TURN_OUTPUTS: Record<string, string> = {
  "flood-predictor": "CRITICAL flood within 6 h — Punpun gauge at 3.1 m and rising.",
  "evacuation-planner": "Evacuate Zones A & B — 1,240 residents → 4 shelters via NH-01.",
  "resource-allocator": "Allocated 12 boats · 60 transports · 8 ambulances to staging.",
  validator: "Plan validated — SOP 4.2 compliant; shelter capacity within limits.",
  "communications-agent": "Broadcast queued — SMS + IVR to 12,400 subscribers.",
};

const IDLE_OUTPUT = "Standing by — queued in orchestration pipeline.";

/** 2s per agent turn (thinking + completion). */
const TURN_MS = 2000;

type FlowAgentState = {
  status: AgentStatus;
  output: string;
};

function initialStates(): Record<string, FlowAgentState> {
  return Object.fromEntries(
    EMERGENCY_AGENTS.map((agent) => [agent.id, { status: "idle", output: IDLE_OUTPUT }]),
  );
}

/** Animated dashed connector between pipeline stages. */
function FlowConnector() {
  return (
    <span className="flow-connector shrink-0 self-center" aria-hidden>
      <span className="flow-connector-line" />
      <span className="flow-connector-arrow" />
    </span>
  );
}

export function OrchestrationFlow() {
  const [states, setStates] = useState<Record<string, FlowAgentState>>(initialStates);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const runningRef = useRef(false);
  runningRef.current = running;

  // Resets the pipeline and starts the cascade. Guarded by a ref so
  // external triggers (What-If Simulator) can't double-run it.
  const startRun = useCallback(() => {
    if (runningRef.current) return;
    setStates(initialStates());
    setFinished(false);
    setRunning(true);
  }, []);

  // Step 8 — external re-run trigger (What-If Scenario Simulator).
  useEffect(() => {
    const onRerun = () => startRun();
    window.addEventListener(PLANNER_RERUN_EVENT, onRerun);
    return () => window.removeEventListener(PLANNER_RERUN_EVENT, onRerun);
  }, [startRun]);

  // Sequential pipeline: agent i thinks at i*TURN_MS and completes at
  // (i+1)*TURN_MS, so the light cascades left → right every 2 seconds.
  useEffect(() => {
    if (!running) return;
    const timers: number[] = [];

    EMERGENCY_AGENTS.forEach((agent, i) => {
      timers.push(
        window.setTimeout(() => {
          setStates((prev) => ({
            ...prev,
            [agent.id]: { status: "thinking", output: TURN_OUTPUTS[agent.id] },
          }));
        }, i * TURN_MS),
      );
      timers.push(
        window.setTimeout(
          () => {
            setStates((prev) => ({
              ...prev,
              [agent.id]: { status: "complete", output: TURN_OUTPUTS[agent.id] },
            }));
          },
          (i + 1) * TURN_MS,
        ),
      );
    });

    timers.push(
      window.setTimeout(
        () => {
          setRunning(false);
          setFinished(true);
        },
        EMERGENCY_AGENTS.length * TURN_MS + 400,
      ),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [running]);

  const completedCount = EMERGENCY_AGENTS.filter(
    (agent) => states[agent.id]?.status === "complete",
  ).length;

  const handleGenerate = startRun;

  return (
    <section className="shrink-0 rounded-xl border border-accent-purple/30 bg-panel-deep p-3 shadow-[0_0_28px_rgba(168,85,247,0.15)]">
      {/* Pipeline header */}
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-purple/15 text-accent-purple shadow-[0_0_14px_rgba(139,92,246,0.3)]">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-white">Agent Orchestration</h2>
            <p className="truncate text-[0.625rem] uppercase tracking-[0.18em] text-muted">
              Swarm pipeline · 5 agents · Sequential
            </p>
          </div>
        </div>

        {/* Progress readout */}
        <div className="hidden items-center gap-2 sm:flex">
          {running ? (
            <span className="font-mono text-[0.625rem] font-bold uppercase tracking-wider text-accent-purple">
              {completedCount}/{EMERGENCY_AGENTS.length} complete
            </span>
          ) : finished ? (
            <span className="font-mono text-[0.625rem] font-bold uppercase tracking-wider text-accent-success">
              Plan generated
            </span>
          ) : (
            <span className="font-mono text-[0.625rem] font-bold uppercase tracking-wider text-muted">
              Standby
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={running}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-purple px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] transition hover:bg-accent-purple/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Orchestrating…
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" aria-hidden />
              Generate Plan
            </>
          )}
        </button>
      </div>

      {/* Pipeline: agent cards joined by animated connectors */}
      <div className="flex items-stretch gap-1.5 overflow-x-auto pb-0.5">
        {EMERGENCY_AGENTS.map((agent, i) => {
          const state = states[agent.id] ?? { status: "idle", output: IDLE_OUTPUT };
          return (
            <Fragment key={agent.id}>
              <div className="min-w-[150px] flex-1">
                <AgentCard
                  name={agent.name}
                  icon={agent.icon}
                  colorAccent={agent.accent}
                  status={state.status}
                  latestOutput={state.output}
                  className="h-full"
                />
              </div>
              {i < EMERGENCY_AGENTS.length - 1 && <FlowConnector />}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}

export default OrchestrationFlow;
