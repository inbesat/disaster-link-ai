"use client";

// ---------------------------------------------------------------------
// components/gov/ai/OrchestrationFlow.tsx — Agent Orchestration
// Workflow Diagram.
//
// Vertical flow of 5 agent cards connected by animated SVG lines.
// When complete, shows "Plan Ready" banner. The WOW moment.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Play, Sparkles } from "lucide-react";
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

/** Animated SVG connector line between vertical cards. */
function FlowConnector({ active, complete }: { active: boolean; complete: boolean }) {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <svg width="2" height="24" viewBox="0 0 2 24" className="overflow-visible">
        {/* Background line */}
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="24"
          stroke={complete ? "#10b981" : active ? "#8b5cf6" : "#334155"}
          strokeWidth="2"
          strokeDasharray={active ? "4 4" : "none"}
          className={active ? "animate-[dash_0.8s_linear_infinite]" : ""}
        />
        {/* Animated pulse on active */}
        {active && (
          <circle cx="1" cy="12" r="3" fill="#8b5cf6" opacity="0.6">
            <animate
              attributeName="r"
              values="2;4;2"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0.2;0.8"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        {/* Arrow at bottom */}
        <polygon
          points="1,24 -3,18 5,18"
          fill={complete ? "#10b981" : active ? "#8b5cf6" : "#334155"}
        />
      </svg>
      <style jsx>{`
        @keyframes dash {
          to { stroke-dashoffset: -8; }
        }
      `}</style>
    </div>
  );
}

export function OrchestrationFlow() {
  const [states, setStates] = useState<Record<string, FlowAgentState>>(initialStates);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const runningRef = useRef(false);
  runningRef.current = running;

  const startRun = useCallback(() => {
    if (runningRef.current) return;
    setStates(initialStates());
    setFinished(false);
    setRunning(true);
  }, []);

  useEffect(() => {
    const onRerun = () => startRun();
    window.addEventListener(PLANNER_RERUN_EVENT, onRerun);
    return () => window.removeEventListener(PLANNER_RERUN_EVENT, onRerun);
  }, [startRun]);

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

  return (
    <section className="shrink-0 rounded-xl border border-purple-400/30 bg-[#111827] p-3 shadow-[0_0_28px_rgba(139,92,246,0.15)]">
      {/* Pipeline header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 shadow-[0_0_14px_rgba(139,92,246,0.3)]">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-white">Agent Orchestration</h2>
            <p className="truncate text-[0.625rem] uppercase tracking-[0.18em] text-slate-500">
              Swarm pipeline · 5 agents · Sequential
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {running ? (
            <span className="font-mono text-[0.625rem] font-bold uppercase tracking-wider text-purple-400">
              {completedCount}/{EMERGENCY_AGENTS.length} complete
            </span>
          ) : finished ? (
            <span className="font-mono text-[0.625rem] font-bold uppercase tracking-wider text-emerald-400">
              Plan generated
            </span>
          ) : (
            <span className="font-mono text-[0.625rem] font-bold uppercase tracking-wider text-slate-500">
              Standby
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={startRun}
          disabled={running}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] transition hover:bg-purple-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* Plan Ready banner */}
      {finished && (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
          <div>
            <p className="text-sm font-bold text-emerald-300">Plan Ready</p>
            <p className="text-[0.625rem] text-emerald-400/70">
              All agents completed. Review the action plan below.
            </p>
          </div>
        </div>
      )}

      {/* Vertical agent flow */}
      <div className="flex flex-col items-center">
        {EMERGENCY_AGENTS.map((agent, i) => {
          const state = states[agent.id] ?? { status: "idle", output: IDLE_OUTPUT };
          const isLast = i === EMERGENCY_AGENTS.length - 1;
          const nextAgent = EMERGENCY_AGENTS[i + 1];
          const nextComplete = nextAgent
            ? states[nextAgent.id]?.status === "complete"
            : false;

          return (
            <div key={agent.id} className="w-full">
              <AgentCard
                name={agent.name}
                icon={agent.icon}
                colorAccent={agent.accent}
                status={state.status}
                latestOutput={state.output}
              />
              {!isLast && (
                <FlowConnector
                  active={state.status === "thinking"}
                  complete={state.status === "complete"}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default OrchestrationFlow;
