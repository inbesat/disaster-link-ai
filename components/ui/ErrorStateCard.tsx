"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type ErrorStateCardProps = {
  /** Short human title — e.g. "Data Pipeline Degraded". */
  title: string;
  /** Safe, human-readable explanation. Raw DB/API error strings are
   *  scrubbed by `sanitizeMessage` before rendering. */
  message?: string;
  /** Re-runs the failed fetch. Fired when the user clicks Retry. */
  onRetry: () => void;
  /** Extra classes (e.g. compact padding in a table cell). */
  className?: string;
};

const FALLBACK_MESSAGE =
  "The system could not complete this operation. Please try again — your data remains safe.";

/**
 * Scrubs anything that looks like a raw backend/API error before it reaches
 * the UI. Drops legacy PostgreSQL/Prisma prefixes, stack-trace line breaks,
 * connection strings and bracketed digests; anything still suspicious
 * collapses to the generic fallback so we never leak internals.
 */
function sanitizeMessage(raw?: string): string {
  if (!raw) return FALLBACK_MESSAGE;

  const suspicious =
    /(postgres|prisma|sqlite|pg[:\/]|mongodb|connection_string|connect ECONN|failed\b.*\bat\b|stacktrace| at .+\.(js|ts|mjs|tsx)\b|^\s*\n)/i;

  if (suspicious.test(raw)) return FALLBACK_MESSAGE;

  const clean = raw
    .replace(/\r?\n\s*\r?\n/g, "\n")
    .replace(/\s{2,}/g, " ")
    .trim();

  return clean.length > 0 ? clean : FALLBACK_MESSAGE;
}

/**
 * Phase 8 · Step 6 — graceful in-page error state.
 *
 * A subtle red-tinted card with a pulsing alert triangle and a
 * "Retry Connection" ghost action. Shakes gently on mount to signal that
 * something failed, then settles into a calm notice. Users only ever see
 * the sanitized `message`, never raw database or API errors.
 */
export function ErrorStateCard({
  title,
  message,
  onRetry,
  className = "",
}: ErrorStateCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center gap-4 rounded-eoc border border-severity-red-600/40 bg-severity-red-600/5 px-6 py-10 text-center ${className}`}
    >
      {/* Alert icon — shakes horizontally once on mount, then pulses */}
      <motion.span
        className="flex h-12 w-12 items-center justify-center rounded-full border border-severity-red-600/50 bg-severity-red-600/10"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -6, 6, -4, 4, -2, 2, 0],
                transition: { duration: 0.5, ease: "easeOut" },
              }
        }
      >
        <AlertTriangle className="h-6 w-6 text-severity-red-400" aria-hidden />
      </motion.span>

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
          {title}
        </h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
          {sanitizeMessage(message)}
        </p>
      </div>

      {/* Ghost retry button — never exposes the raw error */}
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-accent transition hover:border-accent hover:bg-accent/10 hover:text-accent"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        Retry Connection
      </button>
    </motion.div>
  );
}

export default ErrorStateCard;
