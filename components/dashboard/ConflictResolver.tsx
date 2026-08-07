"use client";

import { useState } from "react";
import { AlertTriangle, Save, CheckCircle2, Scale } from "lucide-react";
import toast from "react-hot-toast";
import {
  applyLastWriteWins,
  mergeShelterEdits,
  type ShelterEdit,
  type VersionedValue,
} from "@/lib/realtime";

const SHELTER_NAME = "Kankarbagh Shelter";

// Two responders edited the same shelter concurrently. The remote edit lands
// later, so per-field merge keeps its occupancy while preserving the fields
// only the local edit touched — this is the Phase 20 step 7 "merge" path.
const MY_EDIT: ShelterEdit = {
  clientId: "you",
  version: 1,
  updatedAt: "2026-08-08T10:00:00.000Z",
  baseVersion: 0,
  occupancy: 120,
  status: "open",
};

const THEIR_EDIT: ShelterEdit = {
  clientId: "NDRF_Admin",
  version: 1,
  updatedAt: "2026-08-08T10:00:06.000Z", // newer — wins the occupancy field
  baseVersion: 0,
  occupancy: 150,
  notes: "Opened overflow section",
};

export default function ConflictResolver() {
  const [open, setOpen] = useState(false);

  // Real merge: per-field last-write-wins over the two concurrent edits.
  const merged = mergeShelterEdits(MY_EDIT, THEIR_EDIT);
  const mergedOccupancy = merged.occupancy ?? 0;

  function acceptMerge() {
    setOpen(false);
    toast(
      `Merged: occupancy ${mergedOccupancy} (${merged.clientId}, newer) · status "${merged.status ?? "—"}" preserved` +
        (merged.conflicts.length > 0
          ? ` · conflicted field(s): ${merged.conflicts.join(", ")}`
          : ""),
      { icon: "🧬" },
    );
  }

  function keepMine() {
    setOpen(false);
    // Force your value through last-write-wins against the merged state.
    const current: VersionedValue<number> = {
      clientId: merged.clientId,
      version: merged.version,
      updatedAt: merged.updatedAt,
      baseVersion: merged.baseVersion,
      value: mergedOccupancy,
    };
    const result = applyLastWriteWins(current, {
      clientId: "you",
      version: merged.version + 1,
      updatedAt: new Date().toISOString(), // newest — wins
      baseVersion: merged.version,
      value: MY_EDIT.occupancy ?? 0,
    });
    toast.success(
      `Kept your occupancy of ${result.state.value} — version bumped to ${result.state.version}.`,
    );
  }

  return (
    <>
      {/* Demo trigger: shows the real per-field merge resolving two concurrent edits. */}
      <div className="rounded-eoc border border-border bg-surface p-4 shadow-glow-accent">
        <p className="eoc-label flex items-center gap-2 text-accent">
          <Scale className="h-4 w-4" />
          CONCURRENCY (DEMO)
        </p>
        <p className="mt-1 text-sm text-slate-300">
          Two admins edited {SHELTER_NAME} at once. Click to run the per-field
          last-write-wins merge on the concurrent edits.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-amber-400 bg-amber-500/10 px-4 text-sm font-bold uppercase tracking-wider text-amber-300 transition hover:bg-amber-500/20"
        >
          <AlertTriangle className="h-5 w-5" />
          Simulate Concurrent Edit
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Concurrent edit detected"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border-2 border-amber-400 bg-[#1a1708] p-6 shadow-[0_0_60px_rgba(245,158,11,0.35)]">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-500/15">
                <AlertTriangle className="h-6 w-6 text-amber-300" />
              </span>
              <div>
                <p className="eoc-label text-amber-300">CONCURRENT EDIT DETECTED</p>
                <h2 className="text-lg font-bold text-foreground">Merge conflict</h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              <span className="font-bold text-foreground">{THEIR_EDIT.clientId}</span>{" "}
              updated <span className="font-bold text-foreground">{SHELTER_NAME}</span> while
              you were typing. The per-field merge kept the newer value per field
              and preserved fields only one side touched.
            </p>

            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-amber-400/30 text-left text-[10px] uppercase tracking-wider text-amber-300/80">
                  <th className="py-1 pr-2">Field</th>
                  <th className="py-1 pr-2">You</th>
                  <th className="py-1 pr-2">Them</th>
                  <th className="py-1">Merged</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr>
                  <td className="py-1.5 pr-2 font-semibold text-foreground">Occupancy</td>
                  <td className="py-1.5 pr-2">{MY_EDIT.occupancy}</td>
                  <td className="py-1.5 pr-2">{THEIR_EDIT.occupancy}</td>
                  <td className="py-1.5 font-bold text-amber-300">{mergedOccupancy} ⬅ newer</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 font-semibold text-foreground">Status</td>
                  <td className="py-1.5 pr-2">{MY_EDIT.status}</td>
                  <td className="py-1.5 pr-2 text-slate-500">—</td>
                  <td className="py-1.5 font-bold text-emerald-300">
                    &ldquo;{merged.status}&rdquo; kept
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 font-semibold text-foreground">Notes</td>
                  <td className="py-1.5 pr-2 text-slate-500">—</td>
                  <td className="py-1.5 pr-2">{THEIR_EDIT.notes}</td>
                  <td className="py-1.5 font-bold text-emerald-300">kept</td>
                </tr>
              </tbody>
            </table>

            <p className="mt-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
              {merged.conflicts.length > 0
                ? `Conflicted field(s): ${merged.conflicts.join(", ")} — newest value wins`
                : "No field conflicts — clean merge"}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={keepMine}
                className="flex min-h-[52px] items-center gap-3 rounded-xl border-2 border-cyan-400/60 bg-cyan-500/10 px-4 text-left text-cyan-200 transition hover:bg-cyan-500/20"
              >
                <Save className="h-6 w-6 shrink-0 text-cyan-300" />
                <span className="text-base font-bold">
                  Overwrite with my data ({MY_EDIT.occupancy})
                </span>
              </button>
              <button
                type="button"
                onClick={acceptMerge}
                className="flex min-h-[52px] items-center gap-3 rounded-xl border-2 border-emerald-400/60 bg-emerald-500/10 px-4 text-left text-emerald-200 transition hover:bg-emerald-500/20"
              >
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-300" />
                <span className="text-base font-bold">Accept merged result</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
