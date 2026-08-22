"use client";

// ---------------------------------------------------------------------
// components/settings/ai/ResponseStyleCard.tsx — AI Assistant (Phase 4 · Step 3).
//
// Behavior tuning:
//   • Response Verbosity slider with 3 snap points — Concise (Bullet
//     Points) · Balanced (Paragraphs) · Detailed (Full Sources).
//   • AI Personality segmented group — Professional (Formal) ·
//     Collaborative (Team-oriented) · Urgent (Action-focused).
//   • Live mock "Preview Message" that reacts to both selections.
// ---------------------------------------------------------------------

import {
  MessageSquareText,
  Ruler,
  Speech,
} from "lucide-react";
import { useAiSettings } from "@/lib/settings/AiSettingsContext";
import { buildResponsePreview } from "@/lib/settings/ai-response-preview";
import type {
  AiPersonality,
  ResponseVerbosity,
} from "@/lib/settings/ai-settings";

const VERBOSITY_SNAPS: {
  value: ResponseVerbosity;
  index: 0 | 1 | 2;
  label: string;
  sub: string;
}[] = [
  { value: "concise", index: 0, label: "Concise", sub: "Bullet Points" },
  { value: "balanced", index: 1, label: "Balanced", sub: "Paragraphs" },
  { value: "detailed", index: 2, label: "Detailed", sub: "Full Sources" },
];

const PERSONALITY_OPTIONS: {
  value: AiPersonality;
  label: string;
  pill: string;
}[] = [
  { value: "professional", label: "Professional", pill: "Formal" },
  { value: "collaborative", label: "Collaborative", pill: "Team-oriented" },
  { value: "urgent", label: "Urgent", pill: "Action-focused" },
];

export default function ResponseStyleCard() {
  const { settings, update } = useAiSettings();
  const verbosity = settings.responseVerbosity;
  const personality = settings.personality;
  const previewLines = buildResponsePreview(verbosity, personality);
  const activeSnapIndex =
    VERBOSITY_SNAPS.findIndex((snap) => snap.value === verbosity) || 0;

  function setVerbosity(value: ResponseVerbosity) {
    update({ responseVerbosity: value });
  }

  function setPersonality(value: AiPersonality) {
    update({ personality: value });
  }

  return (
    <section
      data-settings-key="ai-response-style"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/10">
          <Speech className="h-5 w-5 text-fuchsia-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-fuchsia-300/80">BEHAVIOR</p>
          <h2 className="mt-0.5 text-lg font-bold">Response Style &amp; Personality</h2>
        </div>
      </div>

      {/* Verbosity slider */}
      <div className="mt-5">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Ruler className="h-3.5 w-3.5" aria-hidden />
          Response Verbosity
        </p>

        <input
          type="range"
          aria-label="Response verbosity"
          min={0}
          max={2}
          step={1}
          value={activeSnapIndex}
          onChange={(event) => {
            const index = Number(event.target.value);
            const snap = VERBOSITY_SNAPS.find((s) => s.index === index);
            if (snap) setVerbosity(snap.value);
          }}
          className="mt-4 w-full cursor-pointer appearance-none rounded-full bg-transparent"
          style={{
            background: `linear-gradient(to right, #d946ef ${(activeSnapIndex / 2) * 100}%, #2c3f6d ${(activeSnapIndex / 2) * 100}%)`,
          }}
        />

        <div className="mt-2 grid grid-cols-3 gap-2">
          {VERBOSITY_SNAPS.map((snap) => {
            const active = snap.value === verbosity;
            return (
              <button
                key={snap.value}
                type="button"
                onClick={() => setVerbosity(snap.value)}
                aria-pressed={active}
                className={`rounded-md border px-2 py-2 text-center transition ${
                  active
                    ? "border-fuchsia-400/60 bg-fuchsia-500/10"
                    : "border-panel-border bg-surface-muted/40 hover:border-fuchsia-400/40"
                }`}
              >
                <p className={`text-xs font-semibold ${active ? "text-fuchsia-200" : "text-slate-300"}`}>
                  {snap.label}
                </p>
                <p className="mt-0.5 text-eoc-tiny text-slate-500">{snap.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personality segmented control */}
      <div className="mt-5">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Speech className="h-3.5 w-3.5" aria-hidden />
          AI Personality / Tone
        </p>
        <div
          className="mt-2 flex gap-2"
          role="radiogroup"
          aria-label="AI personality tone"
        >
          {PERSONALITY_OPTIONS.map((option) => {
            const active = personality === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPersonality(option.value)}
                className={`flex-1 rounded-md border px-2 py-2.5 text-center transition ${
                  active
                    ? "border-fuchsia-400/60 bg-fuchsia-500/10"
                    : "border-panel-border bg-surface-muted/40 hover:border-fuchsia-400/40"
                }`}
              >
                <p className={`text-xs font-semibold ${active ? "text-fuchsia-200" : "text-slate-300"}`}>
                  {option.label}
                </p>
                <p className="mt-0.5 text-eoc-tiny text-slate-500">{option.pill}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview message */}
      <div className="mt-5">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
          Preview Message
        </p>
        <div
          data-testid="ai-preview"
          className={`mt-2 rounded-lg border border-panel-border bg-[#0a0f1a] p-4 ${
            personality === "urgent" ? "border-red-400/30" : ""
          }`}
        >
          <div className="flex items-center gap-2 rounded-t-md border-b border-panel-border pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-fuchsia-500/15 text-eoc-tiny font-bold text-fuchsia-300">
              AI
            </span>
            <p className="text-[11px] font-semibold text-slate-400">
              Command Assistant · {personality} ·{" "}
              {VERBOSITY_SNAPS.find((s) => s.value === verbosity)?.sub}
            </p>
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {previewLines.map((line, lineIndex) => (
              <li
                key={`${lineIndex}-${line.slice(0, 12)}`}
                className={`text-sm leading-relaxed ${
                  personality === "urgent" ? "text-orange-200" : "text-slate-300"
                }`}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Live mock — reflects your verbosity &amp; tone choices above.
        </p>
      </div>
    </section>
  );
}