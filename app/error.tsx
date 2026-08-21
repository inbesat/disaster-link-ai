"use client";

import { useEffect } from "react";
import SystemErrorFallback from "@/components/ui/SystemErrorFallback";
import { captureException } from "@/lib/monitoring/sentry";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
    void captureException(error, { source: "app/error", digest: error.digest });
  }, [error]);

  return <SystemErrorFallback error={error} reset={reset} digest={error.digest} />;
}
