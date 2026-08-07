"use client";

import { useEffect } from "react";
import SystemErrorFallback from "@/components/ui/SystemErrorFallback";
// The root layout is bypassed when this renders, so the design tokens in
// globals.css must be loaded here for the fallback to look correct.
import "./globals.css";

/**
 * Phase 22 · Step 4 — root error boundary.
 *
 * Next.js renders this instead of the root layout when a fatal error escapes
 * the layout tree (e.g. in layout.tsx itself). It must own its <html>/<body>
 * tags. "Try Again" calls `reset()` to re-attempt the full render.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <SystemErrorFallback reset={reset} digest={error.digest} fullPage />
      </body>
    </html>
  );
}
