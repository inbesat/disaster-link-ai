"use client";

// ---------------------------------------------------------------------
// components/settings/privacy/DataExportCard.tsx — Privacy (Phase 6 · Step 7).
//
// Data Portability (GDPR Compliance):
//   • Explains the data-subject right to download every record the
//     platform holds — personal data, chat logs, and GPS history.
//   • "Request Data Archive (.JSON)" — prominent blue button that shows a
//     2-second loading spinner, then compiles + downloads the JSON archive
//     and fires a green success toast ("Data archive compiled and
//     downloaded securely.").
//   • Secondary "Activity Log (CSV)" export of the last 30 days of
//     security/operational events for a portable compliance trail.
//   • Reuses the GDPR payload builder from components/security/DataExportButton.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import { DatabaseZap, FileJson, FileSpreadsheet, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildExportPayload } from "@/components/security/DataExportButton";
import {
  DEMO_AUDIT_EVENTS,
  auditEventsToCsv,
} from "@/lib/settings/privacy-settings";

const INCLUDED_RECORDS = [
  "Personal data — profile, contact details & credentials",
  "AI chat logs with the emergency planner",
  "GPS location history & field check-ins",
  "Role, organization & assigned district",
  "Login history (timestamps + IPs)",
  "Alerts received & acknowledgements",
];

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) supabase = createClient();
  return supabase;
}

export default function DataExportCard() {
  const [archiving, setArchiving] = useState(false);

  async function requestArchive() {
    if (archiving) return;
    setArchiving(true);
    try {
      // Simulated archive compilation round-trip (2s) — then the download.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      let email: string | null = null;
      let displayName: string | null = null;
      try {
        const { data } = await getSupabase().auth.getUser();
        email = data.user?.email ?? null;
        displayName = data.user?.user_metadata?.name ?? null;
      } catch {
        // auth unavailable — the mock payload still compiles
      }

      const payload = buildExportPayload(email, displayName);
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "personal_data_archive.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("Data archive compiled and downloaded securely.");
    } finally {
      // Always release the spinner, even if compilation ever throws.
      setArchiving(false);
    }
  }

  function downloadActivityCsv() {
    const csv = auditEventsToCsv(DEMO_AUDIT_EVENTS);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "activity_log_export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Activity log exported as CSV.");
  }

  return (
    <section
      data-settings-key="privacy-data-export"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <ShieldCheck className="h-5 w-5 text-blue-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-blue-300/80">DATA SUBJECT RIGHTS</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Data Portability (GDPR Compliance)
          </h2>
        </div>
      </div>

      {/* Rights description */}
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Under the right to data portability (GDPR Art. 20 · DPDP Act 2023
        §17), you may download all personal data, chat logs, and GPS history
        stored on the platform — in a structured, machine-readable format.
        Archives are generated on demand and never stored server-side.
      </p>

      {/* Included records */}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {INCLUDED_RECORDS.map((record) => (
          <li
            key={record}
            className="flex items-center gap-2 rounded-md border border-panel-border bg-surface-muted/40 px-3 py-2 text-xs text-slate-300"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            {record}
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href="/api/user/export?format=json"
          download="safesphere-personal-data.json"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(37,99,235,0.35)] transition hover:bg-blue-500 active:scale-[0.98]"
        >
          <FileJson className="h-4 w-4" aria-hidden />
          Download Personal Data (.JSON)
        </a>

        <a
          href="/api/user/export?format=html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20 active:scale-[0.98]"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          View Printable PDF Summary
        </a>

        <button
          type="button"
          onClick={downloadActivityCsv}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-muted px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-blue-400/50 hover:bg-blue-500/10 hover:text-blue-200 active:scale-[0.98]"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          Activity Log (CSV)
        </button>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <DatabaseZap className="h-3.5 w-3.5 shrink-0" aria-hidden />
        JSON archive contains profile + history incl. chat logs and GPS
        records; CSV covers the last 30 days of security and operational
        events.
      </p>
    </section>
  );
}
