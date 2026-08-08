"use client";

// ---------------------------------------------------------------------
// components/settings/contacts/ContactVerificationCard.tsx — Contacts (Phase 7 · Step 9).
//
// Contact Health Check — reachability diagnostics:
//   • "Ensure your emergency contacts are reachable before deploying to a
//     dead zone."
//   • "Ping All Contacts (Test)" simulates a 2-second verification sweep,
//     then reveals a mock summary table: Primary Contact ✅ Delivered,
//     District Control ✅ Delivered, Alternate Contact ❌ Failed —
//     Invalid Number.
//   • Re-runnable so the demo can repeat the sweep live.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Loader2,
  RadioTower,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type PingStatus = "idle" | "testing" | "done";

const CONTACTS: {
  name: string;
  number: string;
  delivered: boolean;
  error?: string;
}[] = [
  { name: "Primary Contact", number: "+91 98110 22334", delivered: true },
  { name: "District Control", number: "0612-2217305", delivered: true },
  {
    name: "Alternate Contact",
    number: "+91 90041 55667",
    delivered: false,
    error: "Invalid Number",
  },
];

export default function ContactVerificationCard() {
  const [status, setStatus] = useState<PingStatus>("idle");

  const deliveredCount = CONTACTS.filter((c) => c.delivered).length;

  function runPing() {
    if (status === "testing") return;
    setStatus("testing");
    // Simulated 2-second verification sweep across all channels.
    window.setTimeout(() => {
      setStatus("done");
      toast(`Ping complete — ${deliveredCount} of ${CONTACTS.length} contacts reachable.`);
    }, 2000);
  }

  return (
    <section
      data-settings-key="contacts-health-check"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <RadioTower className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-emerald-300/80">DIAGNOSTICS · REACHABILITY</p>
          <h2 className="mt-0.5 text-lg font-bold">Contact Health Check</h2>
        </div>
        {status === "done" && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            {deliveredCount}/{CONTACTS.length} reachable
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Ensure your emergency contacts are reachable before deploying to a
        dead zone.
      </p>

      {/* Results table */}
      <div
        aria-live="polite"
        className="mt-5 overflow-hidden rounded-md border border-[#1c2740]"
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#1c2740] bg-[#0a0f1d] text-[10px] uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-bold">Contact</th>
              <th className="px-4 py-2.5 font-bold">Number</th>
              <th className="px-4 py-2.5 text-right font-bold">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#151d31]">
            {CONTACTS.map((contact) => {
              const testing = status === "testing";
              return (
                <tr
                  key={contact.name}
                  className="bg-surface-muted/20 transition-colors hover:bg-surface-muted/40"
                >
                  <td className="px-4 py-3 text-xs font-semibold text-slate-200">
                    {contact.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] tabular-nums text-slate-400">
                    {contact.number}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {testing ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        Checking…
                      </span>
                    ) : status === "done" && contact.delivered ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                        Delivered
                      </span>
                    ) : status === "done" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300">
                        <XCircle className="h-3 w-3" aria-hidden />
                        Failed — {contact.error}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          {status === "testing"
            ? "Sweeping all channels for reachability…"
            : status === "done"
              ? "Re-run the sweep any time — failed lines should be updated before deployment."
              : "Sends a silent test ping to every configured channel."}
        </p>
        <button
          type="button"
          onClick={runPing}
          disabled={status === "testing"}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(16,185,129,0.35)] transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {status === "testing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Pinging…
            </>
          ) : (
            <>
              <RadioTower className="h-4 w-4" aria-hidden />
              Ping All Contacts (Test)
            </>
          )}
        </button>
      </div>
    </section>
  );
}
