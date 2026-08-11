"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageSquareWarning, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";

// ---------------------------------------------------------------------
// components/gov/dashboard/CrowdReportsWidget.tsx — Phase 7 · Step 4.
//
// 1×1 feed of UNVERIFIED citizen reports pouring in from the public app.
// Every row has two one-tap actions: ✓ Verify (promotes the report to a
// confirmed incident — row turns green and is flagged) and ✗ Reject
// (dismisses the row with an exit animation). Both fire a confirmation
// toast so a live demo reads as instant command feedback.
// ---------------------------------------------------------------------

type CrowdReport = {
  id: string;
  text: string;
  area: string;
  time: string;
  /** Report still awaiting command review. */
  status: "pending" | "verified";
};

const INITIAL_REPORTS: CrowdReport[] = [
  { id: "r1", text: "Road blocked in Sector 4 — bus stuck in water", area: "Sector 4", time: "1m ago", status: "pending" },
  { id: "r2", text: "Water entering ground floor, families on rooftop", area: "Kankarbagh", time: "4m ago", status: "pending" },
  { id: "r3", text: "Power line down near Bailey Road crossing", area: "Bailey Road", time: "9m ago", status: "pending" },
  { id: "r4", text: "Two boats needed at Mohalla crossing", area: "Danapur", time: "16m ago", status: "pending" },
  { id: "r5", text: "Elderly couple needs evacuation, ground floor", area: "Mithapur", time: "22m ago", status: "pending" },
];

export function CrowdReportsWidget() {
  const toast = useToast();
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [verifiedCount, setVerifiedCount] = useState(0);

  const verify = (report: CrowdReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: "verified" } : r)),
    );
    setVerifiedCount((c) => c + 1);
    toast.success({
      title: "Report verified",
      description: `${report.area} — promoted to a confirmed incident.`,
    });
  };

  const reject = (report: CrowdReport) => {
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    toast.error({ title: "Report rejected", description: `${report.area} — dismissed from the feed.` });
  };

  return (
    <section className="flex flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] backdrop-blur transition hover:border-white/20">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <MessageSquareWarning aria-hidden="true" className="h-4 w-4 text-severity-amber-300" />
          <h2 className="eoc-label text-white">Crowdsourced Reports</h2>
        </div>
        <span className="rounded-full border border-severity-amber-400/30 bg-severity-amber-400/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-severity-amber-300">
          {reports.filter((r) => r.status === "pending").length} unverified
        </span>
      </header>

      <ul className="flex-1 space-y-2 p-3">
        <AnimatePresence initial={false}>
          {reports.map((report) => (
            <motion.li
              key={report.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={`rounded-lg border p-3 transition ${
                report.status === "verified"
                  ? "border-severity-green-400/40 bg-severity-green-400/10"
                  : "border-white/10 bg-black/20 hover:bg-black/30"
              }`}
            >
              <p className="text-[0.8125rem] leading-snug text-white/90">{report.text}</p>
              <p className="mt-1 text-[0.6875rem] text-[var(--dl-text-muted)]">
                <span className="font-semibold text-white/60">{report.area}</span>
                {" · "}
                {report.time}
                {report.status === "verified" && (
                  <span className="ml-2 font-semibold uppercase tracking-wide text-severity-green-300">
                    · verified
                  </span>
                )}
              </p>

              <div className="mt-2 flex gap-2">
                {report.status === "verified" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-severity-green-400/30 bg-severity-green-400/10 px-3 py-1.5 text-xs font-semibold text-severity-green-300">
                    <Check className="h-3.5 w-3.5" /> Verified — on live map
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => verify(report)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-severity-green-400/40 bg-severity-green-400/10 px-3 py-1.5 text-xs font-semibold text-severity-green-300 transition hover:bg-severity-green-400/20"
                    >
                      <Check className="h-3.5 w-3.5" /> Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(report)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-severity-red-400/40 bg-severity-red-400/10 px-3 py-1.5 text-xs font-semibold text-severity-red-300 transition hover:bg-severity-red-400/20"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {verifiedCount > 0 && (
        <footer className="border-t border-white/10 px-5 py-3 text-[0.6875rem] text-[var(--dl-text-muted)]">
          <span className="font-semibold text-severity-green-300">{verifiedCount}</span> verified
          {verifiedCount === 1 ? " report" : " reports"} promoted to the live map.
        </footer>
      )}
    </section>
  );
}

export default CrowdReportsWidget;
