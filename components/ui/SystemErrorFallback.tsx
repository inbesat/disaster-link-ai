"use client";

import { useEffect } from "react";
import { RefreshCw, ShieldAlert, LifeBuoy } from "lucide-react";
import { captureException } from "@/lib/monitoring/sentry";

type SystemErrorFallbackProps = {
  /** Next.js `reset()` or custom reset handler */
  reset?: () => void;
  /** Optional error digest or ID */
  digest?: string;
  /** The caught error object */
  error?: Error & { digest?: string };
  /** Full-viewport mode for app/global-error.tsx */
  fullPage?: boolean;
};

export function SystemErrorFallback({
  reset,
  digest,
  error,
  fullPage = false,
}: SystemErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === "development";
  const errorId = digest || error?.digest || `ERR-${Date.now().toString(36).toUpperCase()}`;

  useEffect(() => {
    if (error) {
      void captureException(error, { errorId, source: "SystemErrorFallback" });
    }
  }, [error, errorId]);

  const handleRetry = () => {
    if (reset) {
      reset();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center bg-background px-6 py-12 text-foreground ${
        fullPage ? "min-h-dvh" : "min-h-[50vh]"
      }`}
    >
      <div className="w-full max-w-lg rounded-eoc border border-severity-red-600/50 bg-surface p-8 text-center shadow-glow-red">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-severity-red-600/60 bg-severity-red-600/10">
          <ShieldAlert className="h-8 w-8 animate-pulse text-severity-red-400" aria-hidden />
        </div>

        <p className="eoc-label mt-6 text-severity-red-400">SYSTEM NOTICE</p>
        <h1 className="mt-2 text-xl font-bold leading-snug">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          An unexpected error occurred. Redundancy protocols active. Your data remains safe.
        </p>

        <div className="mt-6 rounded-md border border-border bg-black/40 px-4 py-3 text-left font-mono text-[11px] leading-relaxed text-slate-400">
          <p>
            <span className="text-severity-green-400">&gt;</span> ERROR_ID:{" "}
            <span className="font-bold text-slate-200">{errorId}</span>
          </p>
          <p>
            <span className="text-severity-green-400">&gt;</span> STATUS:{" "}
            <span className="text-severity-red-400">ISOLATED</span>
          </p>
        </div>

        {isDev && error && (
          <div className="mt-4 max-h-40 overflow-y-auto rounded border border-severity-red-900 bg-black/60 p-3 text-left text-xs text-severity-red-300">
            <p className="font-bold">{error.name}: {error.message}</p>
            {error.stack && (
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-slate-400">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-severity-red-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-severity-red-400 transition hover:bg-severity-red-600/10 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Retry
          </button>
          <a
            href={`mailto:support@safesphere.gov.in?subject=Error Report [${errorId}]&body=Error ID: ${errorId}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-accent hover:text-white"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden />
            Report Issue
          </a>
        </div>
      </div>
    </div>
  );
}

export default SystemErrorFallback;
