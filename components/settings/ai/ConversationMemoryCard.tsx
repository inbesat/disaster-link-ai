"use client";

// ---------------------------------------------------------------------
// components/settings/ai/ConversationMemoryCard.tsx — AI Assistant (Phase 4 · Step 6).
//
// Chat history management:
//   • "Context Retention Period" dropdown — 1 Day (Current Operation) ·
//     7 Days · 30 Days · Forever.
//   • "Auto-archive resolved emergency threads" toggle.
//   • Red-accented "Clear All AI Chat History" button → confirmation modal
//     that requires typing "CLEAR" before a simulated cache wipe.
// ---------------------------------------------------------------------

import {
  Archive,
  Eraser,
  History,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAiSettings } from "@/lib/settings/AiSettingsContext";
import type { ContextRetention } from "@/lib/settings/ai-settings";

const RETENTION_OPTIONS: { value: ContextRetention; label: string }[] = [
  { value: "1d", label: "1 Day (Current Operation)" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "forever", label: "Forever" },
];

export default function ConversationMemoryCard() {
  const { settings, update } = useAiSettings();
  const memory = settings.memory;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [wiping, setWiping] = useState(false);

  function setRetention(retention: ContextRetention) {
    update({ memory: { ...memory, retention } });
  }

  function toggleArchive() {
    update({ memory: { ...memory, autoArchiveResolved: !memory.autoArchiveResolved } });
  }

  function requestClear() {
    setTyped("");
    setConfirmOpen(true);
  }

  function closeModal() {
    if (!wiping) setConfirmOpen(false);
  }

  function performWipe() {
    if (wiping) return;
    setWiping(true);
    // Simulate the cache wipe for the demo.
    window.setTimeout(() => {
      setWiping(false);
      setConfirmOpen(false);
      setTyped("");
      toast.success("All AI chat history cleared.");
    }, 1200);
  }

  const canConfirmClaim = typed.trim().toUpperCase() === "CLEAR";

  return (
    <section
      data-settings-key="ai-memory"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
          <History className="h-5 w-5 text-sky-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-sky-300/80">CONTEXT & MEMORY</p>
          <h2 className="mt-0.5 text-lg font-bold">Conversation Memory</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Controls how long the assistant remembers past operations and when
        context is archived or pruned.
      </p>

      {/* Retention dropdown */}
      <div className="mt-5">
        <label
          htmlFor="ai-retention"
          className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-400"
        >
          CONTEXT RETENTION PERIOD
        </label>
        <div className="relative">
          <select
            id="ai-retention"
            value={memory.retention}
            onChange={(event) => setRetention(event.target.value as ContextRetention)}
            className="w-full appearance-none rounded-md border border-panel-border bg-[#0a0f1a] px-3 py-2.5 pr-9 text-sm text-slate-200 outline-none transition focus:border-sky-400/60"
          >
            {RETENTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
            <svg
              className="h-4 w-4 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {memory.retention === "forever" && "Unlimited context — heavier usage + memory cost."}
          {memory.retention === "1d" && "Optimizes for the current operation only."}
          {memory.retention === "7d" && "Keeps a week of operational context."}
          {memory.retention === "30d" && "Retains a month of context for review."}
        </p>
      </div>

      {/* Auto-archive toggle */}
      <div className="mt-4 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-500/10">
              <Archive className="h-4 w-4 text-sky-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Auto-archive resolved emergency threads
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Resolved incidents move to cold storage automatically, keeping
                the active window focused.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={memory.autoArchiveResolved}
            aria-label="Toggle auto-archive resolved threads"
            onClick={toggleArchive}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              memory.autoArchiveResolved ? "bg-sky-500" : "bg-[#2c3f6d]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                memory.autoArchiveResolved ? "translate-x-[22px]" : "-translate-x-[2px]"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Clear history */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-panel-border pt-4">
        <p className="flex items-center gap-2 text-[11px] text-slate-500">
          <Eraser className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
          Permanently wipes all assistant conversations from this device.
        </p>
        <button
          type="button"
          onClick={requestClear}
          className="inline-flex items-center gap-2 rounded-md border border-red-400/60 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Clear All AI Chat History
        </button>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-clear-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md rounded-eoc border border-red-400/40 bg-surface p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15">
                <Trash2 className="h-5 w-5 text-red-300" aria-hidden />
              </div>
              <div>
                <p className="eoc-label text-red-300/80">DESTRUCTIVE ACTION</p>
                <h2
                  id="ai-clear-modal-title"
                  className="mt-0.5 text-lg font-bold"
                >
                  Clear All AI Chat History?
                </h2>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-400">
              This wipes every conversation, including operation briefs and
              archived threads. To confirm, type{" "}
              <span className="rounded border border-red-400/40 bg-red-500/10 px-1.5 py-0.5 font-mono font-bold text-red-300">
                CLEAR
              </span>{" "}
              below.
            </p>

            <label
              htmlFor="ai-clear-confirm"
              className="mt-4 block text-[11px] font-semibold tracking-wide text-slate-400"
            >
              TYPE &quot;CLEAR&quot; TO CONFIRM
            </label>
            <input
              id="ai-clear-confirm"
              type="text"
              value={typed}
              autoFocus
              disabled={wiping}
              onChange={(event) => setTyped(event.target.value.toUpperCase())}
              placeholder="CLEAR"
              className="mt-1.5 w-full rounded-md border border-panel-border bg-[#0a0f1a] px-3 py-2.5 font-mono text-sm tracking-widest text-slate-200 outline-none transition focus:border-red-400/60"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={wiping}
                className="rounded-md border border-panel-borderHover bg-[#0a0f1a] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performWipe}
                disabled={!canConfirmClaim || wiping}
                className="inline-flex items-center gap-2 rounded-md border border-red-400 bg-red-500/15 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {wiping ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                {wiping ? "Wiping…" : "Wipe Chat History"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
