"use client";

import { useEffect } from "react";
import SystemErrorFallback from "@/components/ui/SystemErrorFallback";
import { captureException } from "@/lib/monitoring/sentry";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
    void captureException(error, { source: "app/global-error", digest: error.digest });
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <SystemErrorFallback error={error} reset={reset} digest={error.digest} fullPage />
      </body>
    </html>
  );
}
