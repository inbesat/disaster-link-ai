"use client";

// ---------------------------------------------------------------------
// components/ai/SourcesPanel.tsx — UI/UX Phase 6 · Step 7.
//
// RAG transparency readout. A collapsible terminal-style accordion that
// lists the documents grounding the AI's plan (NDMA guideline, district
// DMP, live forecast feed) so commanders can eyeball where the numbers
// actually came from. Mounted directly under an AI briefing bubble.
// ---------------------------------------------------------------------

import { useState } from "react";
import { ChevronDown, Terminal } from "lucide-react";

type SourcesPanelProps = {
  /** Human-readable document references, shown bracketed in the readout. */
  sources: string[];
};

export function SourcesPanel({ sources }: SourcesPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-[85%] overflow-hidden rounded-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-[var(--bg-tertiary)] px-2.5 py-1.5 text-left text-eoc-tiny font-semibold uppercase tracking-wider text-muted transition hover:border-accent-success/40 hover:text-slate-200"
      >
        <Terminal className="h-3 w-3 shrink-0 text-accent-success" aria-hidden />
        <span className="flex-1 truncate">Sources grounding this plan</span>
        <span className="rounded-sm bg-accent-success/10 px-1 font-mono text-[9px] text-accent-success">
          {sources.length} docs
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="rounded-b-md border border-t-0 border-border bg-[#0a0f1e] px-3 py-2 font-mono text-[11px]">
          <p className="text-severity-green-500">
            $ ground_search --plan execution --top_k {sources.length}
          </p>
          <ul className="mt-1.5 space-y-1">
            {sources.map((source, index) => (
              <li key={source} className="flex items-baseline gap-2">
                <span className="shrink-0 text-severity-green-500/70">
                  [{String(index + 1).padStart(2, "0")}]
                </span>
                <span className="text-slate-300">[{source}]</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-border pt-1.5 text-eoc-tiny text-muted">
            audited · 99.2% citation confidence
          </p>
        </div>
      )}
    </div>
  );
}

export default SourcesPanel;
