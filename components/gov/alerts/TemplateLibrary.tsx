"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/TemplateLibrary.tsx — Phase 11 · Step 3 ·
// Legal & SOP Templates Library.
//
// Officials don't have time to type long messages mid-crisis. This modal
// (opened from the Alert Composer's Message card) lists the three
// hardcoded SOP templates with their {variable} tokens highlighted as
// chips, so the official can see at a glance what needs filling in.
//
// Clicking "Use Template" drops the body straight into the composer's
// message box (raw, tokens intact — the composer's variable-highlighter
// then flags them for the official to complete).
//
// Modal conventions match the codebase: role="dialog" + aria-modal,
// backdrop click + Escape close, focus moved in on open / restored on
// close, X IconButton dismiss.
// ---------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { BookOpen, X } from "lucide-react";
import {
  QUICK_ALERT_TEMPLATES,
  splitByVariables,
  type AlertTemplate,
} from "@/lib/mock-data/gov-alert-templates";
import type { GovAlertSeverity } from "@/lib/mock-data/gov-alert-targets";

const SEVERITY_CHIP: Record<GovAlertSeverity, string> = {
  watch: "border-severity-amber-500/40 bg-severity-amber-500/10 text-severity-amber-300",
  warning: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  critical: "border-severity-red-500/40 bg-severity-red-500/10 text-severity-red-300",
};

/** Renders a template body with {variables} as amber highlight chips. */
export function HighlightedTemplateBody({ body }: { body: string }) {
  return (
    <p className="text-sm leading-relaxed text-slate-200">
      {splitByVariables(body).map((segment, i) =>
        /^\{[a-z_]+\}$/.test(segment) ? (
          <mark
            key={i}
            className="mx-0.5 rounded bg-severity-amber-500/20 px-1 py-0.5 font-mono text-[0.75rem] font-bold text-severity-amber-300"
          >
            {segment}
          </mark>
        ) : (
          <span key={i}>{segment}</span>
        ),
      )}
    </p>
  );
}

export type TemplateLibraryProps = {
  open: boolean;
  onClose: () => void;
  /** Called with the raw template body (tokens intact). */
  onUse: (template: AlertTemplate) => void;
};

export function TemplateLibrary({ open, onClose, onUse }: TemplateLibraryProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousActive?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close template library"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Legal & SOP template library"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-secondary shadow-2xl shadow-black/60"
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-purple/30 bg-accent-purple/10 text-accent-purple">
              <BookOpen className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Template Library
              </h2>
              <p className="text-xs text-muted">
                Legal &amp; SOP approved message templates
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close template library"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4">
          {QUICK_ALERT_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-accent-purple/40"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${
                    SEVERITY_CHIP[template.severity]
                  }`}
                >
                  {template.severity}
                </span>
                <span className="text-[0.6875rem] font-semibold text-slate-400">
                  {template.label}
                </span>
              </div>

              <HighlightedTemplateBody body={template.body} />

              <button
                type="button"
                onClick={() => onUse(template)}
                className="mt-3 flex h-9 w-full items-center justify-center rounded-lg border border-accent-purple/40 bg-accent-purple/10 text-xs font-bold uppercase tracking-wider text-accent-purple transition hover:bg-accent-purple/20"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>

        <footer className="border-t border-white/10 px-5 py-3">
          <p className="text-[0.6875rem] text-muted">
            <mark className="mr-1 rounded bg-severity-amber-500/20 px-1 py-0.5 font-mono text-[0.625rem] font-bold text-severity-amber-300">
              {`{variable}`}
            </mark>
            tokens are highlighted in the composer — replace them before sending.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default TemplateLibrary;
