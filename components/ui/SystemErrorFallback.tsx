import { RefreshCw, ShieldAlert } from "lucide-react";

type SystemErrorFallbackProps = {
  /** Next.js `reset()` — re-attempts rendering the failed segment. */
  reset: () => void;
  /** Optional error digest to show in the readout (Next injects one). */
  digest?: string;
  /** Full-viewport mode for app/global-error.tsx (own <html>/<body>). */
  fullPage?: boolean;
};

/**
 * Phase 22 · Step 4 — shared "System Degraded" fallback.
 *
 * Rendered by app/error.tsx (route boundary) and app/global-error.tsx (root).
 * Styled as an intentional Emergency Operations Center notice — red warning
 * icon, status readout, and a Try Again action — so a crash reads as a
 * controlled system message rather than a broken web app.
 */
export function SystemErrorFallback({
  reset,
  digest,
  fullPage = false,
}: SystemErrorFallbackProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-background px-6 py-20 text-foreground ${
        fullPage ? "min-h-dvh" : "min-h-[60vh]"
      }`}
    >
      <div className="w-full max-w-md rounded-eoc border border-severity-red-600/50 bg-surface p-8 text-center shadow-glow-red">
        {/* Pulsing red warning icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-severity-red-600/60 bg-severity-red-600/10">
          <ShieldAlert
            className="h-8 w-8 animate-pulse text-severity-red-400"
            aria-hidden
          />
        </div>

        <p className="eoc-label mt-6 text-severity-red-400">SYSTEM DEGRADED</p>
        <h1 className="mt-2 text-xl font-bold leading-snug">
          Non-critical system failure. Redundancy protocols active.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          The control plane hit an unexpected fault. Your data remains safe and
          no alerts have been lost. Retry the operation to re-establish the
          link.
        </p>

        {/* Terminal-style status readout */}
        <div className="mt-6 rounded-md border border-border bg-black/40 px-4 py-3 text-left font-mono text-[11px] leading-relaxed text-slate-400">
          <p>
            <span className="text-severity-green-400">&gt;</span> EOC.STATUS:{" "}
            <span className="text-severity-red-400">DEGRADED</span>
          </p>
          <p>
            <span className="text-severity-green-400">&gt;</span> REDUNDANCY:{" "}
            <span className="text-severity-green-400">ACTIVE</span>
            {digest ? (
              <>
                {" "}· DIGEST <span className="text-slate-300">{digest}</span>
              </>
            ) : null}
          </p>
          <p>
            <span className="text-severity-green-400">&gt;</span> AWAITING_RETRY…
          </p>
        </div>

        {/* Try Again — calls Next.js reset() */}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-7 inline-flex items-center gap-2 rounded-lg border-2 border-severity-red-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-severity-red-400 transition hover:bg-severity-red-600/10 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Try Again
        </button>
      </div>
    </div>
  );
}

export default SystemErrorFallback;
