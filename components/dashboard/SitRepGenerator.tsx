"use client";

import { useState } from "react";

const METRICS = [
  { label: "People at Risk", value: "48,210" },
  { label: "Shelters Open", value: "132" },
  { label: "Resources Deployed", value: "1,847" },
  { label: "Active Responders", value: "863" },
];

const GAPS = [
  { category: "Boats", required: 120, supply: 76 },
  { category: "Med-Kits", required: 500, supply: 312 },
  { category: "Food Rations", required: 1200, supply: 1230 },
  { category: "Water Pallets", required: 900, supply: 610 },
  { category: "Rescue Teams", required: 40, supply: 32 },
  { category: "Generators", required: 60, supply: 74 },
];

const TIMELINE = [
  "08:00 — AI Prediction Issued: flood risk elevated to WARNING.",
  "09:15 — SMS Alert Broadcast: 1,240 residents notified.",
  "10:30 — Evacuation Fleet Dispatched: 6 boats + 3 buses.",
  "12:45 — Bridge Collapse Reported on NH-31 near Digha.",
  "14:10 — Shelter Overflow Warning: Riverside High School at 100%.",
];

export default function SitRepGenerator() {
  const [open, setOpen] = useState(false);

  function printReport() {
    window.print();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-foreground transition hover:bg-surface-muted"
      >
        📄 Generate Daily SitRep
      </button>

      {open && (
        <>
          {/* Print-only: hide the app chrome, keep only the report. */}
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #sitrep-report, #sitrep-report * { visibility: visible; }
              #sitrep-report { position: absolute; left: 0; top: 0; width: 100%; }
            }
          `}</style>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative max-h-[85vh] w-full max-w-2xl overflow-auto rounded-eoc border border-border bg-surface shadow-2xl">
              {/* Report body — white A4-style for the print dialog */}
              <div id="sitrep-report" className="bg-white p-8 text-black">
                <header className="border-b-4 border-black pb-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest">
                    Disaster Response Platform · District EOC
                  </p>
                  <h1 className="mt-1 text-2xl font-black print:text-black">
                    DAILY SITUATION REPORT
                  </h1>
                  <p className="mt-1 text-xs">
                    District: Patna (Ganga) · {new Date().toLocaleDateString()} ·{" "}
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </header>

                {/* Key metrics */}
                <section className="mt-5">
                  <h2 className="text-sm font-black uppercase tracking-wider">
                    Key Metrics
                  </h2>
                  <table className="mt-2 w-full border-collapse text-xs">
                    <tbody>
                      {METRICS.map((m) => (
                        <tr key={m.label} className="border-b border-black/30">
                          <td className="py-1.5 pr-2 font-semibold">{m.label}</td>
                          <td className="py-1.5 text-right font-black tabular-nums">
                            {m.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                {/* Gap analysis */}
                <section className="mt-5">
                  <h2 className="text-sm font-black uppercase tracking-wider">
                    Resource Gap Analysis
                  </h2>
                  <table className="mt-2 w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-black text-left uppercase">
                        <th className="py-1.5 pr-2 font-bold">Category</th>
                        <th className="py-1.5 pr-2 text-right font-bold">Required</th>
                        <th className="py-1.5 pr-2 text-right font-bold">Supply</th>
                        <th className="py-1.5 text-right font-bold">Deficit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GAPS.map((g) => {
                        const deficit = g.required - g.supply;
                        return (
                          <tr key={g.category} className="border-b border-black/30">
                            <td className="py-1.5 pr-2 font-semibold capitalize">
                              {g.category}
                            </td>
                            <td className="py-1.5 pr-2 text-right tabular-nums">
                              {g.required.toLocaleString()}
                            </td>
                            <td className="py-1.5 pr-2 text-right tabular-nums">
                              {g.supply.toLocaleString()}
                            </td>
                            <td
                              className={`py-1.5 text-right font-black tabular-nums ${
                                deficit > 0 ? "print:text-black" : ""
                              }`}
                            >
                              {deficit > 0 ? `−${deficit.toLocaleString()}` : "+0"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>

                {/* Timeline */}
                <section className="mt-5">
                  <h2 className="text-sm font-black uppercase tracking-wider">
                    Response Timeline
                  </h2>
                  <ul className="mt-2 list-disc pl-5 text-xs">
                    {TIMELINE.map((event) => (
                      <li key={event} className="py-0.5">
                        {event}
                      </li>
                    ))}
                  </ul>
                </section>

                <footer className="mt-6 border-t border-black/40 pt-3 text-xs">
                  <p>
                    Prepared by EOC Command · For official distribution to District
                    Magistrate, NDRF, and agency leads.
                  </p>
                  <p className="mt-2 font-semibold">
                    ____________________
                    <br />
                    District Magistrate / EOC Commander
                  </p>
                </footer>
              </div>

              {/* Modal actions — hidden on print */}
              <div className="flex justify-end gap-2 border-t border-border bg-surface p-4 print:hidden">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-bold text-slate-300 transition hover:text-foreground"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={printReport}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-black uppercase tracking-wider text-slate-950 shadow-glow transition hover:bg-sky-300"
                >
                  🖨️ Print Report
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
