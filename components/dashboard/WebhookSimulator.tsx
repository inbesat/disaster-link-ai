"use client";

import { useState } from "react";
import { Phone, Send, MessageCircle, Wrench } from "lucide-react";
import { parseCitizenReport } from "@/lib/ai/groq-parser";
import type { GroundReport } from "@/lib/crowdsourced/report";

// ---------------------------------------------------------------------
// components/dashboard/WebhookSimulator.tsx (Phase 17 Step 10)
// A "Dev Tools" phone UI that simulates an incoming WhatsApp SOS. On submit it:
//   1. shows an "Incoming SMS Received" toast,
//   2. passes the text through the Groq NLP parser (Phase 17 Step 3),
//   3. builds an UNVERIFIED GroundReport and calls `onNewReport` so the
//      DisasterMap drops a new pulsing "?" marker.
// ---------------------------------------------------------------------

type WebhookSimulatorProps = {
  /** Called with a new unverified report to place on the DisasterMap. */
  onNewReport?: (report: GroundReport) => void;
  /** Default position for the synthetic SMS source. */
  lat?: number;
  lng?: number;
};

const SMS_SUGGESTIONS = [
  "Pani bahut high hai Kankarbagh main road, log faste 3 log #Patna",
  "Ronda me paani bhar gaya, need boat rescue jaldi",
];

export default function WebhookSimulator({
  onNewReport,
  lat = 25.606,
  lng = 85.144,
}: WebhookSimulatorProps) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function pushToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }

  async function handleSend() {
    const message = text.trim();
    if (!message) return;

    setParsing(true);
    pushToast("Incoming SMS Received 📱");

    try {
      // Pass the text straight through the Groq fast NLP parser.
      const parsed = await parseCitizenReport(message);

      const report: GroundReport = {
        id: `sms-${Date.now()}`,
        lat: +(lat + (Math.random() - 0.5) * 0.02).toFixed(6),
        lng: +(lng + (Math.random() - 0.5) * 0.02).toFixed(6),
        report_type:
          parsed.issue === "road_block"
            ? "road_blocked"
            : parsed.issue === "flood"
              ? "flooding"
              : parsed.issue === "rescue"
                ? "rescue"
                : parsed.issue === "shelter_needed"
                  ? "shelter_needed"
                  : "flooding",
        source: "sms",
        raw_text: message,
        severity: parsed.severity,
        confidence_score: parsed.severity / 100,
        verification_status: "unverified",
        people_trapped: parsed.people_trapped,
        people_count: parsed.people_count,
        locations: parsed.locations,
        summary: parsed.summary,
      };

      onNewReport?.(report);
      setText("");
    } catch {
      pushToast("SMS parsing failed — report not added.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="eoc-panel p-4">
      <div className="flex items-center justify-between">
        <p className="eoc-label text-accent">DEV TOOLS · SMS WEBHOOK</p>
        <Wrench className="h-4 w-4 text-slate-400" />
      </div>

      {/* Phone UI mock */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-slate-900">
        <div className="flex items-center justify-between border-b border-border bg-surface-elevated px-3 py-2">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
            <MessageCircle className="h-3.5 w-3.5 text-severity-green-400" /> WhatsApp SOS
          </span>
          <span className="text-[10px] text-slate-500">Control Room</span>
        </div>

        {/* Chat bubble */}
        {text && (
          <div className="flex justify-end px-3 pt-3">
            <div className="max-w-[85%] rounded-lg rounded-tr-none bg-severity-green-600/90 px-3 py-2 text-sm text-white shadow">
              <p className="whitespace-pre-wrap">{text}</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-[9px] text-white/70">
                <span className="mr-1">Citizen</span>
                <span className="inline-block h-2 w-2 rounded-full bg-severity-green-400" />
              </p>
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="mt-3 flex items-center gap-2 border-t border-border bg-surface-muted p-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSend()}
            placeholder="Simulate incoming WhatsApp SOS…"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder-slate-500 outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={parsing || !text.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-severity-green-600 text-white transition hover:bg-severity-green-500 disabled:opacity-50"
            aria-label="Send simulated SOS"
          >
            {parsing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Quick suggestions */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SMS_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setText(s)}
            className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-accent hover:text-accent"
          >
            {s.slice(0, 34)}…
          </button>
        ))}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Phone className="h-3 w-3" /> Simulates an inbound SMS → Groq NLP parse → new
        unverified marker on the map.
      </p>

      {toast && (
        <div className="mt-3 rounded-md border border-severity-amber-600 bg-severity-amber-600/10 px-3 py-2 text-sm font-semibold text-severity-amber-400">
          {toast}
        </div>
      )}
    </div>
  );
}