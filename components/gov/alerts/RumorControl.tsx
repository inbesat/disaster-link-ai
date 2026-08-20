"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/RumorControl.tsx — Phase 11 · Step 6 ·
// Fake News & Rumor Control System.
//
// A specialized alert composer for debunking misinformation that spreads
// on WhatsApp during disasters. Distinct deep-blue identity (#1d4ed8)
// separates it visually from the standard (purple) Omni-Channel Composer,
// so an operator never mistakes a correction for a routine alert.
//
// A rumor correction overwrites the fear signal: it names the FALSE claim
// plainly, then broadcasts the OFFICIAL FACT to every channel. The
// "Published" list keeps a paper trail of what was debunked and when.
// ---------------------------------------------------------------------

import { useState } from "react";
import { Bird, Megaphone, RadioTower, ShieldCheck, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

/** #1d4ed8 deep-blue identity tokens for the entire component. */
const BLUE = {
  panel: "border-[#1d4ed8]/40 bg-[#1d4ed8]/10",
  chip: "bg-[#1d4ed8]/25 text-[#93c5fd]",
  focus: "focus:border-[#3b82f6]/70",
  field: "border-[#1d4ed8]/35 bg-[#1d4ed8]/5",
  button:
    "border-[#1d4ed8]/50 bg-[#1d4ed8] text-white shadow-[0_4px_18px_rgba(29,78,216,0.45)] hover:brightness-110",
  icon: "border-[#1d4ed8]/40 bg-[#1d4ed8]/10 text-[#60a5fa]",
};

/** A previously-published correction, kept as a lightweight paper trail. */
type PublishedCorrection = {
  id: number;
  claim: string;
  fact: string;
  when: string;
};

export function RumorControl() {
  const toast = useToast();
  const [falseClaim, setFalseClaim] = useState("");
  const [officialFact, setOfficialFact] = useState("");
  const [published, setPublished] = useState<PublishedCorrection[]>([]);

  const publish = () => {
    if (!falseClaim.trim() || !officialFact.trim()) {
      toast.warning({
        title: "Both fields required",
        description: "Name the false claim, then state the official fact.",
      });
      return;
    }
    const when = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setPublished((prev) => [
      { id: Date.now(), claim: falseClaim, fact: officialFact, when },
      ...prev,
    ]);
    toast.success({
      title: "🔵 Verified Correction published",
      description: `Debunk broadcast to all channels · "${officialFact}"`,
      duration: 6000,
    });
    setFalseClaim("");
    setOfficialFact("");
  };

  return (
    <section
      className={`rounded-xl border p-5 ${BLUE.panel}`}
      aria-label="Fake news and rumor control"
    >
      {/* Header — distinct deep-blue identity + Verified Correction badge. */}
      <header className="mb-4 flex flex-wrap items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${BLUE.icon}`}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Rumor Control
          </h2>
          <p className="truncate text-xs text-[#93c5fd]">
            Stop false alarms before they spread on WhatsApp
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1d4ed8]/50 bg-[#1d4ed8]/25 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-[#93c5fd]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Verified Correction 🔵
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* False Claim Detected */}
        <div>
          <label
            htmlFor="false-claim"
            className="mb-1.5 flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[#93c5fd]"
          >
            <Bird className="h-3.5 w-3.5" aria-hidden />
            False Claim Detected
          </label>
          <textarea
            id="false-claim"
            value={falseClaim}
            onChange={(e) => setFalseClaim(e.target.value.slice(0, 300))}
            rows={3}
            maxLength={300}
            placeholder={'e.g. "Dam has broken"'}
            className={`w-full resize-y rounded-lg border p-3 text-sm leading-relaxed text-white placeholder:text-[#93c5fd]/40 ${BLUE.field} ${BLUE.focus} focus:outline-none`}
          />
          <p className="mt-1 text-[0.6875rem] text-slate-400">
            {falseClaim.length} / 300 · quote the rumor exactly as it circulates
          </p>
        </div>

        {/* Official Fact */}
        <div>
          <label
            htmlFor="official-fact"
            className="mb-1.5 flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[#93c5fd]"
          >
            <Megaphone className="h-3.5 w-3.5" aria-hidden />
            Official Fact
          </label>
          <textarea
            id="official-fact"
            value={officialFact}
            onChange={(e) => setOfficialFact(e.target.value.slice(0, 300))}
            rows={3}
            maxLength={300}
            placeholder={'e.g. "The dam is structurally sound. Do not panic."'}
            className={`w-full resize-y rounded-lg border p-3 text-sm leading-relaxed text-white placeholder:text-[#93c5fd]/40 ${BLUE.field} ${BLUE.focus} focus:outline-none`}
          />
          <p className="mt-1 text-[0.6875rem] text-slate-400">
            {officialFact.length} / 300 · plain, calm, authoritative
          </p>
        </div>
      </div>

      {/* Publish to All Channels */}
      <button
        type="button"
        onClick={publish}
        className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold uppercase tracking-wider transition active:scale-[0.99] ${BLUE.button}`}
      >
        <RadioTower className="h-4 w-4" aria-hidden />
        Publish to All Channels
      </button>
      <p className="mt-2 text-[0.625rem] leading-snug text-slate-400">
        Broadcasts the official fact over In-App Push, SMS, WhatsApp and Voice — tagged 🔵
        Verified Correction in every inbox.
      </p>

      {/* Paper trail of published corrections. */}
      {published.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[0.625rem] font-bold uppercase tracking-wider text-slate-400">
            Published corrections · {published.length}
          </p>
          <ul className="space-y-2">
            {published.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-[#1d4ed8]/25 bg-[#1d4ed8]/5 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[0.6875rem] font-bold text-[#93c5fd]">
                    <ShieldCheck className="h-3 w-3" aria-hidden />
                    Correction broadcast · {item.when}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove from list"
                    onClick={() =>
                      setPublished((prev) => prev.filter((p) => p.id !== item.id))
                    }
                    className="rounded p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  <span className="font-bold text-severity-red-300">FALSE: </span>
                  {item.claim}
                </p>
                <p className="mt-0.5 text-xs text-slate-200">
                  <span className="font-bold text-[#93c5fd]">FACT: </span>
                  {item.fact}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default RumorControl;
