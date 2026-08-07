"use client";

import { useEffect } from "react";
import SystemErrorFallback from "@/components/ui/SystemErrorFallback";

/**
 * Phase 22 · Step 4 — route-level error boundary.
 *
 * Next.js renders this when a page/segment throws. It keeps the root layout
 * (Navbar, theme, EmergencyContactCard) alive and shows the shared "System
 * Degraded" notice; "Try Again" calls the provided `reset()` to re-attempt
 * the failed render. Fatal root-layout errors fall through to global-error.tsx.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort diagnostic for the console — never crashes the boundary.
    console.error("[app/error]", error);
  }, [error]);

  return <SystemErrorFallback reset={reset} digest={error.digest} />;
}
