"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/AlertHistory.tsx — Phase 11 · Step 10 ·
// Alert History & Audit Log (PDF Export).
//
// Legal compliance + post-disaster review. A data table of every past
// alert (Date/Time, Alert Type, Sender, Target Area, Channels Used) with
// a "Download Audit Report (PDF)" action.
//
// The button simulates a formal stamped PDF by triggering window.print():
// a @media print rule hides the app chrome (sidebar, top bar, nav) via the
// visibility trick and renders only the #print-audit document framed as a
// legal filing — full A4, black-on-white, with a header, an officer's
// block and a rotated OFFICIAL AUDIT seal.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Bug, Download, Filter, History } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
  GOV_ALERT_CHANNELS,
  GOV_ALERT_TYPES,
  type GovAlertChannel,
} from "@/lib/mock-data/gov-alert-targets";

type PastAlert = {
  id: string;
  sentAt: string;
  type: string;
  severity: string;
  sender: string;
  targetArea: string;
  channels: GovAlertChannel[];
};

const HISTORY: PastAlert[] = [
  {
    id: "A-1107",
    sentAt: "2026-08-11 14:32",
    type: "flood_warning",
    severity: "warning",
    sender: "Ananya Sharma",
    targetArea: "Danapur · Maner · 8 villages",
    channels: ["push", "sms", "whatsapp", "voice"],
  },
  {
    id: "A-1106",
    sentAt: "2026-08-11 09:15",
    type: "evac_order",
    severity: "watch",
    sender: "Rajiv Menon",
    targetArea: "Ernakulam · 14 wards",
    channels: ["push", "sms"],
  },
  {
    id: "A-1105",
    sentAt: "2026-08-10 21:04",
    type: "evac_order",
    severity: "warning",
    sender: "Ananya Sharma",
    targetArea: "Kamrup · 6 blocks",
    channels: ["sms", "voice"],
  },
  {
    id: "A-1104",
    sentAt: "2026-08-10 16:48",
    type: "road_closure",
    severity: "watch",
    sender: "Prakash Iyer",
    targetArea: "Barauni · NH-31 stretch",
    channels: ["push", "whatsapp"],
  },
  {
    id: "A-1103",
    sentAt: "2026-08-10 11:22",
    type: "flood_warning",
    severity: "critical",
    sender: "Meera Devi",
    targetArea: "Samastipur · 21 villages",
    channels: ["push", "sms", "whatsapp", "voice"],
  },
  {
    id: "A-1102",
    sentAt: "2026-08-09 18:03",
    type: "evac_order",
    severity: "watch",
    sender: "Rajiv Menon",
    targetArea: "Patna · 3 shelters",
    channels: ["push", "sms"],
  },
  {
    id: "A-1101",
    sentAt: "2026-08-09 07:41",
    type: "flood_warning",
    severity: "critical",
    sender: "Meera Devi",
    targetArea: "Katihar · 4 blocks",
    channels: ["sms", "voice", "whatsapp"],
  },
];

const SEVERITY_CHIP: Record<string, string> = {
  watch: "border-severity-amber-500/40 bg-severity-amber-500/10 text-severity-amber-300",
  warning: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  critical: "border-severity-red-500/40 bg-severity-red-500/10 text-severity-red-300",
};

const channelMeta = (id: GovAlertChannel) =>
  GOV_ALERT_CHANNELS.find((c) => c.value === id);

export function AlertHistory() {
  const toast = useToast();
  const [filter, setFilter] = useState<string>("all");
  // Hydration-safe generated date: toLocaleDateString() can differ between
  // SSR and the browser (timezone/date rollover) — gate behind mounted.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // The filter chips are built from alert *types* only (see below), so a
  // type match is the honest predicate — no dead severity/sender branches.
  const rows = useMemo(
    () => (filter === "all" ? HISTORY : HISTORY.filter((a) => a.type === filter)),
    [filter],
  );

  const downloadAudit = () => {
    toast.info({
      title: "Generating audit report…",
      description: "Legal PDF layout prepared — sending to the printer dialogue.",
    });
    // Let the toast paint, then open the browser print dialogue which the
    // @media print rules render as the stamped legal document.
    setTimeout(() => window.print(), 250);
  };

  return (
    <section
      className="rounded-xl border border-white/10 bg-secondary p-5"
      aria-label="Alert history and audit log"
    >
      <header className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-purple/30 bg-accent-purple/10 text-accent-purple">
          <History className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Alert History &amp; Audit Log
          </h2>
          <p className="truncate text-xs text-muted">
            {HISTORY.length} dispatches · retained 180 days · tamper-evident
          </p>
        </div>
        <button
          type="button"
          onClick={downloadAudit}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent-primary px-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_18px_rgba(59,130,246,0.4)] transition hover:brightness-110 active:scale-[0.99]"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download Audit Report (PDF)
        </button>
      </header>

      {/* Filter chips (screen only — stripped from the print layout). */}
      <div className="print-hidden mb-3 flex flex-wrap items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-slate-400" aria-hidden />
        {["all", ...Array.from(new Set(HISTORY.map((a) => a.type)))].map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold capitalize transition ${
              filter === f
                ? "border-accent-purple/60 bg-accent-purple/15 text-accent-purple"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {/* The printable audit document — #print-audit is the only visible
          region inside @media print. */}
      <div className="overflow-x-auto">
        <div id="print-audit">
          {/* Audit letterhead + official seal — hidden on screen. */}
          <div className="print-only">
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <p className="text-xl font-black tracking-tight text-black">
                  BIHAR DISASTER MANAGEMENT COUNCIL
                </p>
                <p className="text-[0.6875rem] uppercase tracking-widest text-neutral-700">
                  District Control Room · Civil Lines, Patna · Reg. No. BDMC/2026
                </p>
              </div>
              <div className="relative h-24 w-24 shrink-0">
                <div className="absolute inset-0 flex items-center justify-center rounded-full border-4 border-neutral-800">
                  <p className="-rotate-12 text-center text-[0.5rem] leading-tight font-black uppercase text-neutral-800">
                    Official
                    <br />
                    Audit Copy
                    <br />✦ BDMC ✦
                  </p>
                </div>
              </div>
            </div>
            <h1 className="mt-4 text-lg font-black uppercase tracking-wide text-black">
              Alert Dispatch Register — Audit Report
            </h1>
            <p className="text-[0.6875rem] text-neutral-700">
              Fiscal period 2026 · Generated {mounted ? new Date().toLocaleDateString() : "—"} · Prepared
              under the Disaster Management Act for post-incident review. The undersigned
              certifies the entries below are a true record of the alert dispatch log.
            </p>
          </div>

          {/* On-screen + print table. */}
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/15 text-[0.625rem] font-bold uppercase tracking-wider text-slate-400 print:border-black print:text-neutral-800">
                <th scope="col" className="py-2 pr-3">
                  Date / Time
                </th>
                <th scope="col" className="py-2 pr-3">
                  Alert Type
                </th>
                <th scope="col" className="py-2 pr-3">
                  Sender
                </th>
                <th scope="col" className="py-2 pr-3">
                  Target Area
                </th>
                <th scope="col" className="py-2">
                  Channels Used
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((alert) => {
                const meta = GOV_ALERT_TYPES.find((t) => t.value === alert.type);
                return (
                  <tr
                    key={alert.id}
                    className="border-b border-white/5 text-sm text-slate-200 print:border-black print:text-neutral-900"
                  >
                    <td className="py-2.5 pr-3 font-mono text-xs tabular-nums whitespace-nowrap">
                      {alert.sentAt}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span aria-hidden>{meta?.emoji}</span>
                        <span className="font-semibold capitalize text-white print:text-black">
                          {meta?.label ?? alert.type}
                        </span>
                        <span
                          className={`rounded-full border px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide ${SEVERITY_CHIP[alert.severity]}`}
                        >
                          {alert.severity}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-300 print:text-neutral-900">
                      {alert.sender}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-300 print:text-neutral-900">
                      {alert.targetArea}
                    </td>
                    <td className="py-2.5">
                      <span className="flex flex-wrap gap-1">
                        {alert.channels.map((c) => (
                          <span
                            key={c}
                            className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.625rem] font-bold text-slate-300 print:border-black print:bg-white print:text-neutral-800"
                          >
                            {channelMeta(c)?.label}
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-muted">
                    No alerts match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Audit signature block — print only. */}
          <div className="print-only mt-8 grid grid-cols-2 gap-10">
            <div>
              <p className="border-t border-neutral-800 pt-1 text-[0.6875rem] font-bold uppercase text-neutral-800">
                Ananya Sharma
              </p>
              <p className="text-[0.625rem] text-neutral-700">
                District Emergency Manager · Sign &amp; date
              </p>
            </div>
            <div>
              <p className="border-t border-neutral-800 pt-1 text-[0.6875rem] font-bold uppercase text-neutral-800">
                Rajiv Menon
              </p>
              <p className="text-[0.625rem] text-neutral-700">
                Control Room Officer · Sign &amp; date
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="print-hidden mt-3 flex items-center gap-1.5 text-[0.625rem] text-slate-500">
        <Bug className="h-3 w-3" aria-hidden />
        Demo export: opens the browser print dialogue — @media print strips the sidebar
        and chrome, leaving only the stamped legal document.
      </p>

      {/* Print stylesheet for the legal layout. */}
      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          @page { margin: 16mm 14mm; }
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #print-audit, #print-audit * { visibility: visible; }
          #print-audit {
            position: absolute;
            inset: 0;
            width: 100%;
            background: #fff;
            color: #0f172a;
            padding: 0;
          }
          .print-only { display: block !important; }
          .print-hidden { display: none !important; }
          #print-audit table th, #print-audit table td {
            font-size: 10pt;
            padding: 4pt 6pt;
            border-bottom: 1px solid #444;
          }
          #print-audit table thead th { border-bottom: 2px solid #000; }
        }
      `}</style>
    </section>
  );
}

export default AlertHistory;
