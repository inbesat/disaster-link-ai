import Link from "next/link";
import { ArrowLeft, AlertTriangle, Phone } from "lucide-react";

/**
 * not-found.tsx — branded 404 page for SafeSphere.
 * Deep navy background, animated pulse ring, prominent Dashboard CTA.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--bg-primary)] px-4 text-center">
      {/* Subtle radial glow behind the 404 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(59,130,246,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-lg space-y-8">
        {/* Animated pulse ring */}
        <div className="relative mx-auto h-28 w-28">
          <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent-primary)]/10" />
          <span className="absolute inset-2 animate-pulse rounded-full border-2 border-[var(--accent-primary)]/20" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full border border-[var(--accent-primary)]/30 bg-[var(--bg-secondary)]">
            <AlertTriangle
              className="h-10 w-10 text-[var(--accent-primary)]"
              aria-hidden
            />
          </div>
        </div>

        {/* Error code */}
        <p className="font-mono text-sm font-semibold tracking-widest text-[var(--accent-primary)]">
          ERROR 404
        </p>

        {/* Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          You&apos;re off the grid
        </h1>

        {/* Description */}
        <p className="mx-auto max-w-sm text-base leading-relaxed text-[var(--text-secondary)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back to the command center.
        </p>

        {/* Primary CTA — Dashboard */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 rounded-full bg-[var(--accent-primary)] px-7 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-all hover:bg-[var(--accent-primary)]/90 hover:shadow-[0_0_28px_rgba(59,130,246,0.35)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-6 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
          >
            Back to Home
          </Link>
        </div>

        {/* Emergency footer */}
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)]">
            Emergency? Call{" "}
            <a
              href="tel:112"
              className="font-semibold text-[var(--accent-danger)] transition hover:underline"
            >
              112
            </a>{" "}
            (India Emergency) or{" "}
            <a
              href="tel:1070"
              className="font-semibold text-[var(--accent-primary)] transition hover:underline"
            >
              1070
            </a>{" "}
            (Disaster Helpline)
          </p>
        </div>
      </div>
    </div>
  );
}
