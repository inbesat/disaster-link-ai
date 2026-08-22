"use client";

// ---------------------------------------------------------------------
// components/ai/ContextPreview.tsx — Offline-First Architecture · Phase 5
// The "Context Preview" debug panel (developer mode only). Shows exactly
// what gets injected into the AI before each query:
//
//   • Section toggles — [SITUATION] / [RESOURCES] / [WEATHER] /
//     [KNOWLEDGE] each independently enable/disable.
//   • Syntax-highlighted, monospace text area (VS Code dark vibes) with
//     the live context block.
//   • Word/token count indicator + the truncated notice when > 2000 tokens.
//   • "Test Prompt" — builds the full augmented prompt from a draft
//     question and shows it in a second panel.
//
// The panel renders read-only (it's a debug inspection tool), but the
// returned flags object can be fed back into buildContext() so toggles
// genuinely change what the model sees.
// ---------------------------------------------------------------------

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Eye, FlaskConical, TerminalSquare, Trash2 } from "lucide-react";
import { buildAugmentedPrompt } from "@/lib/offline-context/prompts";

export type ContextSectionKey = "situation" | "resources" | "weather" | "knowledge";

const SECTION_META: { key: ContextSectionKey; label: string }[] = [
  { key: "situation", label: "[SITUATION]" },
  { key: "resources", label: "[RESOURCES]" },
  { key: "weather", label: "[WEATHER]" },
  { key: "knowledge", label: "[KNOWLEDGE]" },
];

interface SectionToggle {
  key: ContextSectionKey;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

interface ContextPreviewProps {
  /** Live context text produced by buildContext(). */
  context: string;
  /** Per-section raw blocks for the collapsible view. */
  sections?: Record<ContextSectionKey, string>;
  /** Token estimate of `context`. */
  tokenCount: number;
  /** District the context was built for. */
  district?: string;
  /** Row-counts summary line. */
  counts?: Record<string, number>;
  toggles?: SectionToggle[];
  onReset?: () => void;
}

const MAX_TOKENS = 2000;

export function ContextPreview({
  context,
  sections,
  tokenCount,
  district,
  counts,
  toggles = [],
  onReset,
}: ContextPreviewProps) {
  const [collapsed, setCollapsed] = useState<Record<ContextSectionKey, boolean>>({
    situation: false,
    resources: false,
    weather: false,
    knowledge: false,
  });
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [draft, setDraft] = useState("Any flood risk in the next 48 hours?");
  const [testPrompt, setTestPrompt] = useState<string | null>(null);

  const overBudget = tokenCount > MAX_TOKENS;

  const wordCount = useMemo(() => (context ? context.split(/\s+/).length : 0), [context]);

  const toggle = (key: ContextSectionKey) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const runTest = () => {
    setTestPrompt(buildAugmentedPrompt(draft, context));
    setShowFullPrompt(true);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-subtle bg-[#0d1117] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
            <Eye className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Context Preview <span className="text-emerald-600">· dev</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {district && (
            <span className="rounded border border-subtle bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono text-eoc-tiny text-muted">
              {district}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-eoc-tiny font-bold ${
              overBudget
                ? "bg-amber-500/15 text-amber-300"
                : "bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {wordCount} words · {tokenCount}/{MAX_TOKENS} tokens
          </span>
        </div>
      </div>

      {/* Section toggles */}
      {toggles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {toggles.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={t.onToggle}
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-eoc-tiny font-semibold transition ${
                t.enabled
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                  : "border-subtle bg-[var(--bg-tertiary)] text-muted line-through"
              }`}
            >
              {t.label}
            </button>
          ))}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="ml-auto inline-flex items-center gap-1 rounded border border-subtle bg-[var(--bg-tertiary)] px-2 py-1 text-eoc-tiny font-semibold text-muted transition hover:text-slate-200"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              Reset
            </button>
          )}
        </div>
      )}

      {/* Collapsible sections (raw blocks) */}
      {sections && (
        <div className="flex flex-col gap-1.5">
          {SECTION_META.map(({ key, label }) => {
            const body = sections[key] || "";
            const open = !collapsed[key];
            return (
              <div
                key={key}
                className="overflow-hidden rounded-md border border-[#21262d] bg-[#010409]"
              >
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] font-bold text-[#e6edf3] transition hover:bg-[#161b22]"
                >
                  {open ? (
                    <ChevronUp className="h-3 w-3 text-[#8b949e]" aria-hidden />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-[#8b949e]" aria-hidden />
                  )}
                  <span className={body ? "text-[#7ee787]" : "text-[#8b949e]"}>{label}</span>
                  {counts?.[key] !== undefined && (
                    <span className="ml-auto font-mono text-eoc-tiny text-[#8b949e]">
                      {counts[key]} rows
                    </span>
                  )}
                </button>
                {open && (
                  <pre className="whitespace-pre-wrap px-3 pb-2 font-mono text-[11px] leading-relaxed text-[#c9d1d9]">
                    {body || <span className="text-[#8b949e] italic">— disabled or empty —</span>}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Full context textarea */}
      <div className="flex items-center gap-2 pt-1">
        <TerminalSquare className="h-3.5 w-3.5 text-[#8b949e]" aria-hidden />
        <p className="font-mono text-eoc-tiny font-bold uppercase tracking-wider text-[#8b949e]">
          Injected context
        </p>
      </div>
      <textarea
        readOnly
        value={context}
        rows={Math.min(14, Math.max(5, Math.ceil(context.length / 80)))}
        aria-label="Injected AI context (read-only)"
        className="w-full resize-none rounded-md border border-[#21262d] bg-[#010409] p-3 font-mono text-[11px] leading-relaxed text-[#c9d1d9] outline-none focus:border-[#388bfd]"
      />

      {/* Test prompt builder */}
      <div className="flex items-end gap-2 border-t border-[#21262d] pt-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Draft a test question…"
          className="min-w-0 flex-1 rounded-md border border-[#21262d] bg-[#010409] px-3 py-2 font-mono text-[11px] text-[#e6edf3] outline-none focus:border-[#388bfd]"
        />
        <button
          type="button"
          onClick={runTest}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-500"
        >
          <FlaskConical className="h-3.5 w-3.5" aria-hidden />
          Test prompt
        </button>
      </div>

      {showFullPrompt && testPrompt && (
        <div className="flex flex-col gap-1.5 rounded-md border border-[#21262d] bg-[#010409] p-3">
          <p className="font-mono text-eoc-tiny font-bold uppercase tracking-wider text-[#79c0ff]">
            Full augmented prompt
          </p>
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[#e6edf3]">
            {testPrompt}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ContextPreview;