"use client";

// ---------------------------------------------------------------------
// components/field/TaskCard.tsx — Phase 14 · Step 2.
//
// A prioritized, thumb-sized responder task card. Swipe left to trigger
// the massive action ("Start Task" for a new task, "Mark Complete" once
// en route) — react-swipeable drives the gesture, haptics confirm it
// landed. Colors encode priority: red/urgent, amber, green/routine.
//
// The card is a pure presentational wrapper: status transitions live in
// hooks/useOfflineTasks.ts (Step 3), so this stays swappable.
// ---------------------------------------------------------------------

import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Clock, MapPin, Play, Check } from "lucide-react";
import { triggerLightHaptic, triggerHeavyHaptic } from "@/hooks/useHaptics";
import type { FieldTask, TaskPriority } from "@/hooks/useOfflineTasks";

const PRIORITY_STYLE: Record<
  TaskPriority,
  { card: string; chip: string; label: string }
> = {
  URGENT: {
    card: "border-red-500/60 bg-red-500/[0.07]",
    chip: "border-red-400/50 bg-red-500/15 text-red-300",
    label: "URGENT",
  },
  MODERATE: {
    card: "border-amber-400/50 bg-amber-500/[0.06]",
    chip: "border-amber-400/50 bg-amber-500/15 text-amber-300",
    label: "MODERATE",
  },
  ROUTINE: {
    card: "border-emerald-400/40 bg-emerald-500/[0.05]",
    chip: "border-emerald-400/50 bg-emerald-500/15 text-emerald-300",
    label: "ROUTINE",
  },
};

export default function TaskCard({
  task,
  onAction,
}: {
  task: FieldTask;
  onAction: (id: string, action: "start" | "complete") => void;
}) {
  const [swiping, setSwiping] = useState(0); // 0 → no swipe, negative = left

  const done = task.status === "Completed";
  const action = done
    ? null
    : task.status === "Not Started"
      ? { kind: "start" as const, label: "Start Task", icon: Play }
      : { kind: "complete" as const, label: "Mark Complete", icon: Check };

  const priority = PRIORITY_STYLE[task.priority];

  const swipe = useSwipeable({
    // Clamp to the reveal panel width so a fast flick can't fling the
    // card past its revealed action (which sits at w-28 = 112px).
    onSwiping: (e) => setSwiping(Math.max(-112, Math.min(0, e.deltaX))),
    onSwipedLeft: () => {
      triggerLightHaptic();
      setSwiping(-116);
    },
    onSwipedRight: () => setSwiping(0),
    onSwiped: () => setSwiping(0),
    trackTouch: true,
    trackMouse: true,
    delta: 12,
    preventScrollOnSwipe: true,
  });

  const trigger = () => {
    if (!action) return;
    triggerHeavyHaptic();
    onAction(task.id, action.kind);
    setSwiping(0);
  };

  const swipingDone = swiping <= -96;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Revealed action panel (behind the card while swiping left) */}
      {action && (
        <button
          type="button"
          onClick={trigger}
          aria-label={action.label}
          className={`absolute inset-y-0 right-0 flex w-28 flex-col items-center justify-center gap-1 font-black text-white transition ${
            action.kind === "complete" ? "bg-emerald-600" : "bg-amber-600"
          }`}
        >
          <action.icon className="h-7 w-7" aria-hidden />
          <span className="px-2 text-center text-[0.8125rem] leading-tight">
            {action.label}
          </span>
        </button>
      )}

      {/* Foreground card — slides left to expose the action */}
      <article
        {...swipe}
        className={`relative rounded-2xl border-2 p-4 transition-shadow ${
          priority.card
        } ${swipingDone && action ? "shadow-[0_0_24px_rgba(0,0,0,0.5)]" : ""}`}
        style={{
          transform: `translateX(${swiping}px)`,
          transition: swiping === 0 ? "transform 0.25s ease" : "none",
          opacity: done ? 0.72 : 1,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-3xl" aria-hidden>
            {task.emoji}
          </span>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider ${priority.chip}`}
          >
            {priority.label}
          </span>
        </div>

        <h3
          className={`mt-2 text-lg font-bold leading-snug ${
            done ? "text-gray-400 line-through" : "text-gray-100"
          }`}
        >
          {task.title}
        </h3>

        <p className="mt-1 flex items-center gap-1.5 text-base text-cyan-200/80">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {task.location}
        </p>

        <div className="mt-3 flex items-center justify-between">
          {task.dueLabel ? (
            <span
              className={`flex items-center gap-1 text-sm font-bold ${
                task.priority === "URGENT" && !done ? "text-red-300" : "text-gray-400"
              }`}
            >
              <Clock className="h-4 w-4" aria-hidden />
              {task.dueLabel}
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              {task.status === "En Route" ? "En route now" : "No deadline"}
            </span>
          )}

          {done ? (
            <span className="flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-300">
              <Check className="h-4 w-4" aria-hidden /> Complete
            </span>
          ) : (
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-gray-500">
              ← swipe
            </span>
          )}
        </div>

        {/* Status readout */}
        <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-widest text-slate-400">
          {task.status}
        </p>
      </article>
    </div>
  );
}
