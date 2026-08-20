"use client";

// ---------------------------------------------------------------------
// components/field/ShiftHandover.tsx — Phase 14 · Step 10.
//
// End-of-shift handover report for smooth team transitions. Opens from
// the Tasks page ("End Shift & Handover"):
//
//   • Auto-populated shift stats — Tasks Completed (live count from the
//     offline task cache) and Resources Dispatched (demo figure from the
//     command center).
//   • "Notes for Next Shift" textarea with a voice-dictation button
//     (reuses the shared VoiceInputButton — Web Speech API).
//   • "End Shift & Submit Report" POSTs the report to /api/field/handover
//     (offline → queued via OfflineSyncQueue), clears the local task
//     cache, and signs the responder out to the login screen.
// ---------------------------------------------------------------------

import { useState, useTransition } from "react";
import { LogOut, Send, ClipboardList, Boxes } from "lucide-react";
import toast from "react-hot-toast";
import { triggerHeavyHaptic, triggerLightHaptic } from "@/hooks/useHaptics";
import { OfflineSyncQueue } from "@/lib/field-offline";
import { clearOfflineTasks, useOfflineTasks } from "@/hooks/useOfflineTasks";
import { signOutAction } from "@/app/actions/auth";
import VoiceInputButton from "@/components/ui/VoiceInputButton";

const RESPONDER = "Sunita Das · Team Alpha · NDRF";
const RESOURCES_DISPATCHED = 120; // demo figure from the command center

export default function ShiftHandover() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [, startTransition] = useTransition();
  const { stats } = useOfflineTasks();

  async function submit() {
    triggerHeavyHaptic();
    const payload = {
      responder: RESPONDER,
      tasksCompleted: stats.completed,
      resourcesDispatched: RESOURCES_DISPATCHED,
      notes: notes.trim(),
      at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/field/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`handover ${res.status}`);
    } catch {
      OfflineSyncQueue.enqueue({
        url: "/api/field/handover",
        method: "POST",
        body: payload,
      });
    }

    // Clear local tasks so the next shift starts fresh.
    clearOfflineTasks();

    setSubmitted(true);
    toast.success("Shift report submitted — signing out");

    // Sign out after a beat so the confirmation shows.
    setTimeout(() => {
      startTransition(() => {
        void signOutAction();
      });
    }, 1200);
  }

  return (
    <>
      {/* Trigger — End Shift card on the Tasks page */}
      <button
        type="button"
        onClick={() => {
          triggerLightHaptic();
          setOpen(true);
        }}
        className="flex min-h-[64px] w-full items-center justify-between gap-3 rounded-2xl border-2 border-purple-400/50 bg-purple-500/10 px-5 py-4 text-left transition active:scale-[0.98]"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-purple-400/60 bg-purple-500/15 text-purple-300">
            <LogOut className="h-6 w-6" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold text-purple-200">End Shift &amp; Handover</span>
            <span className="block text-sm text-slate-400">Submit report to the next team</span>
          </span>
        </span>
        <span className="text-2xl text-purple-300">→</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shift handover report"
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 p-5"
        >
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-purple-400/50 bg-panel-deep p-6">
            {submitted ? (
              <div className="py-8 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-500/15 text-3xl">
                  ✅
                </span>
                <h2 className="mt-4 text-2xl font-black text-emerald-300">
                  Shift Report Submitted
                </h2>
                <p className="mt-2 text-base text-gray-300">
                  Handover logged. Signing you out — see you next shift.
                </p>
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-purple-400 bg-purple-500/15 text-purple-300">
                    <ClipboardList className="h-7 w-7" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-purple-200">Shift Handover</h2>
                    <p className="text-sm font-bold uppercase tracking-wider text-amber-300">
                      {RESPONDER}
                    </p>
                  </div>
                </header>

                {/* Auto-populated shift stats */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border-2 border-emerald-400/40 bg-emerald-500/10 p-4 text-center">
                    <ClipboardList className="mx-auto h-6 w-6 text-emerald-300" aria-hidden />
                    <p className="mt-1 text-3xl font-black tabular-nums text-emerald-300">
                      {stats.completed}
                    </p>
                    <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-emerald-200/70">
                      Tasks Completed
                    </p>
                  </div>
                  <div className="rounded-2xl border-2 border-cyan-400/40 bg-cyan-500/10 p-4 text-center">
                    <Boxes className="mx-auto h-6 w-6 text-cyan-300" aria-hidden />
                    <p className="mt-1 text-3xl font-black tabular-nums text-cyan-300">
                      {RESOURCES_DISPATCHED}
                    </p>
                    <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-cyan-200/70">
                      Resources Dispatched
                    </p>
                  </div>
                </div>

                {/* Notes for next shift — voice dictation option */}
                <label htmlFor="handover-notes" className="mt-4 block text-sm font-bold uppercase tracking-wider text-slate-400">
                  Notes for Next Shift
                </label>
                <div className="mt-2 flex items-start gap-2">
                  <textarea
                    id="handover-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Road conditions, shelter status, anything the next team must know…"
                    className="min-h-[120px] w-full resize-y rounded-2xl border-2 border-panel-borderStrong bg-panel px-4 py-3 text-base text-gray-100 placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
                  />
                  <VoiceInputButton onTranscription={(t) => setNotes((n) => (n ? `${n} ${t}` : t))} label="Dictate handover notes" />
                </div>

                <button
                  type="button"
                  onClick={() => void submit()}
                  className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-purple-500 text-lg font-black text-white transition active:scale-[0.98]"
                >
                  <Send className="h-5 w-5" /> End Shift &amp; Submit Report
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-3 min-h-[48px] w-full rounded-2xl border border-panel-borderStrong text-base font-bold text-slate-300"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
