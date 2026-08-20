"use client";

// ---------------------------------------------------------------------
// components/field/TaskList.tsx — Phase 14 · Steps 2 + 3.
//
// The prioritized task feed for the responder home:
//   • tasks come from useOfflineTasks (localStorage cache + pending_sync
//     queue + auto-flush on reconnect — Step 3)
//   • each row is a swipeable TaskCard (Step 2) — swipe left to start or
//     mark complete
//   • the amber "☁️ Offline — Sync Paused" chip + pending count appears
//     while disconnected (Step 3 banner requirement)
//   • URGENT cards float to the top (red → amber → green)
// ---------------------------------------------------------------------

import { useMemo } from "react";
import { CloudOff, RefreshCw, CloudUpload, CheckCircle2 } from "lucide-react";
import TaskCard from "@/components/field/TaskCard";
import { useOfflineTasks } from "@/hooks/useOfflineTasks";
import type { TaskPriority } from "@/hooks/useOfflineTasks";

const RANK: Record<TaskPriority, number> = { URGENT: 0, MODERATE: 1, ROUTINE: 2 };

export default function TaskList() {
  const { tasks, online, pendingCount, startTask, markComplete, syncNow, stats } =
    useOfflineTasks();

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const r = RANK[a.priority] - RANK[b.priority];
        if (r !== 0) return r;
        return a.status === "Completed" ? 1 : b.status === "Completed" ? -1 : 0;
      }),
    [tasks],
  );

  const handleAction = (id: string, action: "start" | "complete") => {
    if (action === "start") startTask(id);
    else markComplete(id);
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-wider text-cyan-300">
          Priority Tasks
        </h2>
        <span className="text-sm text-gray-400">
          {stats.completed}/{stats.total} done
        </span>
      </div>

      {/* Step 3 — offline "Sync Paused" banner */}
      {!online && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-4 py-3">
          <p className="flex items-center gap-2 text-base font-bold text-amber-300">
            <CloudOff className="h-5 w-5" aria-hidden />
            ☁️ Offline — Sync Paused
          </p>
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => void syncNow()}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-amber-400 bg-amber-500/15 px-3 text-sm font-bold text-amber-200 transition active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              {pendingCount} queued
            </button>
          )}
        </div>
      )}

      {/* Online + unsynced → slim reminder that the queue auto-flushed */}
      {online && pendingCount > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border-2 border-emerald-400/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-300">
          <CloudUpload className="h-4 w-4" aria-hidden />
          Reconnected — {pendingCount} offline update{pendingCount > 1 ? "s" : ""} queued to sync
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-panel-border bg-panel-deep p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <p className="mt-2 text-lg font-bold text-gray-200">All clear</p>
          <p className="text-sm text-gray-400">No assigned tasks right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((task) => (
            <TaskCard key={task.id} task={task} onAction={handleAction} />
          ))}
        </div>
      )}
    </section>
  );
}
