"use client";

// ---------------------------------------------------------------------
// components/gov/ai/PlanVisualizer.tsx — Phase 9 · Step 4 + Step 10 ·
// Visual Action Plan Renderer + Live Execution Tracker.
//
// Draft mode: a strict military/government operation document — a 4-step
// number-railed accordion timeline (01 ALERT · 02 EVACUATE · 03
// RESOURCES · 04 MONITOR) with mono operation-order microcopy, bordered
// data tables, and per-step Ready/Executed placeholders.
//
// Execution mode (activated when the commander approves — Step 10): the
// four textual steps transform into LIVE progress bars driven by a
// simulated interval ("Alerts: 87% delivered (12,000/13,800)", etc.)
// that creep toward 100%. A red "Halt Operations" panic button stops the
// run: the bars freeze, the doc returns to draft, and PlanApprovalBar
// drops back to Pending Approval (via the PLANNER_HALT_EVENT).
//
// The PlanHistory drawer (Step 9) is mounted in the document header.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  FileText,
  Siren,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import PlanHistory from "./PlanHistory";
import { PLANNER_EXECUTING_EVENT, PLANNER_HALT_EVENT } from "./PlanApprovalBar";

type PlanStep = {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Label + value rows (ALERT channels/areas/message, MONITOR triggers). */
  briefs?: Array<{ label: string; value: string }>;
  /** Bordered data table (EVACUATE assignments, RESOURCE allocations). */
  table?: { headers: string[]; rows: string[][] };
};

const STEPS: PlanStep[] = [
  {
    id: 1,
    code: "01",
    title: "ALERT",
    subtitle: "Notify & instruct the population",
    icon: Siren,
    briefs: [
      { label: "Channels", value: "SMS · IVR · Cell Broadcast · Siren network" },
      { label: "Areas", value: "Zone A · Zone B · Punpun Ghat · 12,400 subscribers" },
      {
        label: "Message",
        value: "River Punpun rising — evacuate low-lying areas by 13:00 IST.",
      },
    ],
  },
  {
    id: 2,
    code: "02",
    title: "EVACUATE",
    subtitle: "Village → shelter assignments",
    icon: Users,
    table: {
      headers: ["Village", "Shelter assignment", "Residents"],
      rows: [
        ["Sonepur", "Rampur High School", "412"],
        ["Rampur", "Zilla School", "380"],
        ["Punpun Ghat", "Community Hall", "248"],
        ["Daulatpur", "NH-01 Staging Camp", "200"],
      ],
    },
  },
  {
    id: 3,
    code: "03",
    title: "RESOURCES",
    subtitle: "What goes where · ETA",
    icon: Truck,
    table: {
      headers: ["Asset", "Destination", "ETA"],
      rows: [
        ["12 Boats", "Punpun Ghat", "12:45"],
        ["60 Transports", "NH-01 Staging", "13:00"],
        ["8 Ambulances", "Shelter Cluster", "13:10"],
        ["120 Volunteers", "Zones A / B", "13:15"],
      ],
    },
  },
  {
    id: 4,
    code: "04",
    title: "MONITOR",
    subtitle: "Checkpoints & triggers",
    icon: Activity,
    briefs: [
      {
        label: "Checkpoints",
        value: "Gauge ≥ 3.2 m · Shelter occupancy ≥ 90% · NH-01 passable",
      },
      {
        label: "Triggers",
        value: "Gauge > 3.2 m → auto-escalate · NH-01 closure → reroute via staging",
      },
    ],
  },
];

/** Live progress per step id (1 alerts, 2 evacuation, 3 resources). */
type LiveProgress = Record<number, number>;

const INITIAL_PROGRESS: LiveProgress = { 1: 87, 2: 65, 3: 80 };
const ALERT_TOTAL = 13800;
const PROGRESS_TICK_MS = 1400;

const PROGRESS_META: Record<number, { label: string; unit: string; live?: boolean }> = {
  1: { label: "Alerts", unit: "delivered" },
  2: { label: "Evacuation", unit: "complete" },
  3: { label: "Resources", unit: "deployed" },
  4: {
    label: "Monitoring",
    unit: "live telemetry · 4/6 checkpoints confirmed",
    live: true,
  },
};

/** Green check placeholder vs. pending ring for each step's execution. */
function ExecutionChip({
  executed,
  onClick,
}: {
  executed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={executed ? "Mark step as not yet executed" : "Mark step as executed"}
      aria-pressed={executed}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition active:scale-95 ${
        executed
          ? "border-accent-success/50 bg-accent-success/10 text-accent-success"
          : "border-white/15 bg-white/[0.04] text-slate-500 hover:border-accent-success/40 hover:text-accent-success"
      }`}
    >
      {executed ? (
        <CheckCircle2 className="h-3 w-3" aria-hidden />
      ) : (
        <span
          className="h-2.5 w-2.5 rounded-full border-[1.5px] border-current opacity-70"
          aria-hidden
        />
      )}
      {executed ? "Executed" : "Ready"}
    </button>
  );
}

/** A live progress row (Execution Mode). */
function ProgressRow({
  stepId,
  icon: Icon,
  pct,
}: {
  stepId: number;
  icon: LucideIcon;
  pct: number;
}) {
  const meta = PROGRESS_META[stepId];

  if (meta.live) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
            <Icon className="h-3.5 w-3.5 text-accent-purple" aria-hidden />
            {meta.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-purple">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-purple"
              aria-hidden
            />
            Live
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-pulse rounded-full bg-accent-purple/70" />
        </div>
        <p className="mt-1.5 font-mono text-[10px] text-slate-400">{meta.unit}</p>
      </div>
    );
  }

  // Alert delivery rounds to the nearest hundred so the live figure reads
  // cleanly ("12,000/13,800" at 87%, exactly per spec) instead of 12,006.
  const delivered = Math.round((ALERT_TOTAL * pct) / 100 / 100) * 100;
  const detail =
    stepId === 1
      ? `${meta.unit} (${delivered.toLocaleString("en-IN")}/${ALERT_TOTAL.toLocaleString("en-IN")})`
      : `${pct}% ${meta.unit}`;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
          <Icon className="h-3.5 w-3.5 text-accent-success" aria-hidden />
          {meta.label}
        </span>
        <span className="font-mono text-[11px] font-bold tabular-nums text-accent-success">
          {pct}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent-success transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-slate-400">{detail}</p>
    </div>
  );
}

export function PlanVisualizer() {
  const toast = useToast();
  const [openStep, setOpenStep] = useState<number | null>(1);
  const [executed, setExecuted] = useState<Record<number, boolean>>({});
  // Step 10 — Execution Mode
  const [executing, setExecuting] = useState(false);
  const [halted, setHalted] = useState(false);
  const [progress, setProgress] = useState<LiveProgress>(INITIAL_PROGRESS);
  const haltedTimer = useRef<number | null>(null);
  const progressRef = useRef<LiveProgress>(INITIAL_PROGRESS);
  progressRef.current = progress;

  // Commander approved → switch to Execution Mode and start the ticker.
  useEffect(() => {
    const onExecuting = () => {
      setHalted(false);
      setProgress(INITIAL_PROGRESS);
      setExecuting(true);
    };
    window.addEventListener(PLANNER_EXECUTING_EVENT, onExecuting);
    return () => window.removeEventListener(PLANNER_EXECUTING_EVENT, onExecuting);
  }, []);

  // Simulated live progress — creeps each tracked step toward 100%, then
  // the interval stops itself (no runaway timer past completion).
  useEffect(() => {
    if (!executing) return;
    const timer = window.setInterval(() => {
      const current = progressRef.current;
      if ([1, 2, 3].every((id) => current[id] >= 100)) {
        window.clearInterval(timer);
        return;
      }
      setProgress((prev) => {
        const next = { ...prev };
        ([1, 2, 3] as const).forEach((stepId) => {
          if (next[stepId] < 100) {
            next[stepId] = Math.min(
              100,
              next[stepId] + 1 + Math.floor(Math.random() * 3),
            );
          }
        });
        return next;
      });
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(timer);
  }, [executing]);

  // Clear the halted-banner timer on unmount.
  useEffect(() => {
    return () => {
      if (haltedTimer.current !== null) window.clearTimeout(haltedTimer.current);
    };
  }, []);

  const handleHalt = () => {
    if (!executing) return;
    setExecuting(false);
    setHalted(true);
    window.dispatchEvent(new CustomEvent(PLANNER_HALT_EVENT));
    toast.error({
      title: "Operations halted",
      description: "Field units notified — no further deployments.",
      duration: 5000,
    });
    haltedTimer.current = window.setTimeout(() => setHalted(false), 4000);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-secondary">
      {/* Operation-order document header */}
      <div className="border-b border-white/10 bg-[#0d1526] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-accent-purple/40 bg-accent-purple/10 text-accent-purple">
              <FileText className="h-3.5 w-3.5" aria-hidden />
            </span>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">
              Field Operation Order
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="eoc-label text-accent-purple">
              OP-ALERT PNP-6-B1 · Punpun Sector
            </span>
            <PlanHistory />
          </div>
        </div>
        {executing ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-success">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-success"
              aria-hidden
            />
            Execution mode · Live · v2.0 approved
          </p>
        ) : (
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Classification: Official · Draft v3 · Approved by: Commander
          </p>
        )}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {halted && (
          <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-accent-danger/50 bg-accent-danger/10 px-3 py-2.5 animate-in fade-in duration-200">
            <span className="mt-0.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent-danger" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-accent-danger">
              Operations halted — field units notified. Re-approve to resume.
            </p>
          </div>
        )}

        {executing ? (
          /* ---------------- Execution Mode: live progress bars ------- */
          <div className="flex flex-col gap-2" aria-live="polite">
            {STEPS.map((step) => (
              <ProgressRow
                key={step.id}
                stepId={step.id}
                icon={step.icon}
                pct={progress[step.id] ?? 0}
              />
            ))}
          </div>
        ) : (
          /* ---------------- Draft mode: accordion timeline ----------- */
          <ol className="flex flex-col gap-1" aria-label="Emergency action plan steps">
            {STEPS.map((step, index) => {
              const isOpen = openStep === step.id;
              const isExecuted = executed[step.id] === true;
              const Icon = step.icon;

              return (
                <li key={step.id} className="relative pl-9">
                  {/* rail connector between steps */}
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[15px] top-9 bottom-0 w-0.5 bg-gradient-to-b from-accent-purple/50 to-accent-purple/10"
                    />
                  )}

                  {/* step number node */}
                  <span
                    aria-hidden
                    className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[11px] font-bold ${
                      isExecuted
                        ? "border-accent-success/60 bg-accent-success/10 text-accent-success"
                        : isOpen
                          ? "border-accent-purple/60 bg-accent-purple/15 text-accent-purple"
                          : "border-white/15 bg-white/5 text-slate-400"
                    }`}
                  >
                    {step.code}
                  </span>

                  {/* step header — the accordion toggle button (title +
                      chevron) keeps the ExecutionChip as a SIBLING so no
                      button nests inside another button */}
                  <div
                    className={`rounded-lg border transition ${
                      isOpen
                        ? "border-accent-purple/40 bg-accent-purple/5"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setOpenStep(isOpen ? null : step.id)}
                        aria-expanded={isOpen}
                        aria-controls={`plan-step-${step.id}`}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isExecuted ? "text-accent-success" : "text-accent-purple"
                          }`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
                            {step.title}
                          </p>
                          <p className="truncate text-[10px] uppercase tracking-wider text-muted">
                            {step.subtitle}
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        />
                      </button>

                      <ExecutionChip
                        executed={isExecuted}
                        onClick={() =>
                          setExecuted((prev) => ({ ...prev, [step.id]: !prev[step.id] }))
                        }
                      />
                    </div>

                    {/* expanded step detail */}
                    {isOpen && (
                      <div
                        id={`plan-step-${step.id}`}
                        className="flex flex-col gap-3 border-t border-white/10 px-3 pb-3 pt-3 animate-in fade-in slide-in-from-top-1 duration-150"
                      >
                        {step.table && (
                          <div className="overflow-hidden rounded-lg border border-white/10">
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-white/[0.04]">
                                <tr>
                                  {step.table.headers.map((header) => (
                                    <th
                                      key={header}
                                      className="px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400"
                                    >
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {step.table.rows.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="odd:bg-white/[0.02]">
                                    {row.map((cell, cellIndex) => (
                                      <td
                                        key={cellIndex}
                                        className={`border-t border-white/10 px-3 py-2 text-slate-300 ${
                                          cellIndex === row.length - 1
                                            ? "font-mono tabular-nums text-accent-purple"
                                            : ""
                                        }`}
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {step.briefs?.map((brief) => (
                          <div
                            key={brief.label}
                            className="rounded-lg border-l-2 border-accent-purple/50 bg-white/[0.03] px-3 py-2"
                          >
                            <p className="eoc-label">{brief.label}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-300">
                              {brief.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* Document footer */}
        {!executing && (
          <p className="mt-4 border-t border-white/10 pt-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600">
            — End of operation order —
          </p>
        )}
      </div>

      {/* Step 10 — panic button: Halt Operations */}
      {executing && (
        <div className="shrink-0 border-t border-white/10 bg-[#0d1526]/95 px-3 py-3 backdrop-blur">
          <button
            type="button"
            onClick={handleHalt}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-accent-danger bg-accent-danger/10 px-4 text-sm font-black uppercase tracking-wider text-accent-danger transition hover:bg-accent-danger hover:text-white active:scale-[0.99]"
          >
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-accent-danger"
              aria-hidden
            />
            Halt Operations
          </button>
          <p className="mt-1.5 text-center text-[10px] text-muted">
            Immediately stops all automated deployments.
          </p>
        </div>
      )}
    </section>
  );
}

export default PlanVisualizer;
