"use client";

// ---------------------------------------------------------------------
// components/admin/broadcast/TestBroadcastModal.tsx — Phase 9 ·
// Safeguarded "Test Broadcast".
//
// Sending a test broadcast requires the admin to type the exact phrase
// "BROADCAST TEST" — a plain button can never trigger it. Even then, the
// route only targets TEST_FM_STATIONS (fake webhook.site endpoints) and
// runs the deterministic dry-run — no real stations, no outbound calls,
// no TTS credits. The message is the harmless test script.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Loader2,
  Radio,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { TEST_BROADCAST_CONFIRMATION } from "@/lib/fm/simulation";

interface TestResult {
  stationName: string;
  frequency: string;
  strategy: string;
  status: string;
  responseCode: number;
}

export default function TestBroadcastModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!open) return null;

  const confirmed = confirmation.trim() === TEST_BROADCAST_CONFIRMATION;

  async function sendTest() {
    if (!confirmed) return;
    setSending(true);
    setResults(null);
    try {
      const res = await fetch("/api/broadcast/fm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: confirmation.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        stations?: TestResult[];
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Test broadcast failed.");
        return;
      }
      setMessage(data.message ?? null);
      setResults(data.stations ?? []);
      toast.success(`Test broadcast delivered to ${data.stations?.length ?? 0} channels.`);
    } catch (error) {
      console.error("Test broadcast failed:", error);
      toast.error("Could not reach the test broadcast service.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Test broadcast"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-panel-border bg-panel p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-300">
            <ShieldAlert className="h-4 w-4" />
            Safeguarded Test Broadcast
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Guard rails */}
        <div className="space-y-2 rounded-lg border border-panel-border bg-primary p-3 text-xs text-slate-400">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Targets <span className="font-semibold text-slate-200">only TEST stations</span> (fake
            webhook.site endpoints) — real stations are never contacted.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Runs a deterministic <span className="font-semibold text-slate-200">dry-run</span> — no
            outbound calls, no TTS credits.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Message:{" "}
            <span className="italic text-slate-300">
              “This is a test of the SafeSphere emergency broadcast system. No action required.”
            </span>
          </p>
        </div>

        {/* Confirmation gate */}
        <label className="mt-4 block">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">
            Type <span className="text-amber-300">{TEST_BROADCAST_CONFIRMATION}</span> to arm the
            test
          </span>
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={TEST_BROADCAST_CONFIRMATION}
            autoFocus
            className="mt-1.5 w-full rounded-md border border-panel-border bg-primary px-3 py-2 font-mono text-sm text-foreground outline-none transition focus:border-amber-400/50"
          />
        </label>

        <button
          type="button"
          disabled={!confirmed || sending}
          onClick={() => void sendTest()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Radio className="h-4 w-4" />
          )}
          {sending ? "Broadcasting test…" : "Send test broadcast"}
        </button>

        {/* Results */}
        {results && (
          <div className="mt-4">
            {message && (
              <p className="mb-2 rounded-md border border-panel-border bg-primary px-3 py-2 text-xs italic text-slate-400">
                {message}
              </p>
            )}
            <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-md border border-panel-border bg-primary px-3 py-2 text-xs"
                >
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {r.stationName}
                    <span className="ml-2 font-mono text-[0.625rem] text-slate-500">
                      {r.frequency}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded border border-panel-border bg-primary px-1.5 py-0.5 text-[0.625rem] font-bold uppercase text-slate-400">
                      {r.strategy}
                    </span>
                    <span className="font-mono text-[0.625rem] text-slate-500">{r.responseCode}</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[0.625rem] text-slate-600">
              TEST mode · logged to fm_broadcast_logs when the database is reachable.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
