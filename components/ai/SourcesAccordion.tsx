"use client";

import { useState } from "react";

export type SourceInvocation = {
  toolName: string;
  input?: unknown;
  output?: unknown;
  state?: string;
  errorText?: string;
};

function formatJson(value: unknown): string {
  if (value === undefined) return "— (no data)";
  if (value === null) return "null";
  try {
    if (typeof value === "string") {
      // Avoid double-encoding a stringified payload.
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * "Sources & Telemetry" — a collapsible, terminal-style readout that shows
 * every tool the model invoked and the raw JSON returned from the database.
 *
 * This is an anti-hallucination control: it lets a judge/commander verify the
 * AI's claims against the exact data it actually pulled.
 */
export default function SourcesAccordion({
  invocations,
  defaultOpen = false,
}: {
  invocations: SourceInvocation[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (invocations.length === 0) return null;

  const done = invocations.every(
    (i) => i.state !== "input-streaming" && i.state !== "partial-call",
  );

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/70 bg-black/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-white/5"
      >
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span className={done ? "text-emerald-300" : "animate-pulse text-amber-300"}>
            ▤
          </span>
          Sources &amp; Telemetry
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-eoc-tiny tabular-nums text-slate-300">
            {invocations.length}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-800 px-3 py-3">
          {invocations.map((inv, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between gap-2">
                <code className="text-[11px] font-semibold text-sky-300">
                  {inv.toolName}
                </code>
                <span
                  className={`font-mono text-eoc-tiny font-bold ${isLabel(inv.state).tone}`}
                >
                  {isLabel(inv.state).text}
                </span>
              </div>

              <div className="mt-1.5 space-y-1.5">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600">
                    input
                  </p>
                  <pre className="max-h-32 overflow-auto rounded border border-slate-800 bg-slate-950 px-2 py-1.5 font-mono text-eoc-tiny leading-relaxed text-slate-400">
                    {formatJson(inv.input)}
                  </pre>
                </div>

                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600">
                    output
                  </p>
                  {inv.errorText ? (
                    <pre className="max-h-32 overflow-auto rounded border border-red-900/60 bg-red-950/40 px-2 py-1.5 font-mono text-eoc-tiny leading-relaxed text-red-300">
                      {inv.errorText}
                    </pre>
                  ) : inv.output !== undefined ? (
                    <pre className="max-h-32 overflow-auto rounded border border-slate-800 bg-slate-950 px-2 py-1.5 font-mono text-eoc-tiny leading-relaxed text-emerald-200/90">
                      {formatJson(inv.output)}
                    </pre>
                  ) : (
                    <pre className="px-1 font-mono text-eoc-tiny text-slate-600">
                      {inv.state === "input-streaming" || inv.state === "partial-call"
                        ? "waiting for tool output…"
                        : "no output returned"}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isLabel(state: string | undefined): { text: string; tone: string } {
  if (!state) return { text: "READY", tone: "text-slate-500" };
  if (
    state === "input-streaming" ||
    state === "partial-call" ||
    state === "output-streaming"
  ) {
    return { text: "RUNNING", tone: "text-amber-300" };
  }
  if (state === "error") return { text: "FAILED", tone: "text-red-400" };
  if (state === "output-available" || state === "complete") {
    return { text: "DATA", tone: "text-emerald-300" };
  }
  return { text: "READY", tone: "text-slate-500" };
}
