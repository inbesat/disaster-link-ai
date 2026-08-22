"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * StickyMobileCTA — fixed bottom bar visible only on mobile (md:hidden).
 * Renders a full-width gradient CTA button pinned to the very bottom of
 * the viewport. Use for primary conversion actions like "Request Demo".
 *
 * Usage:
 *   <StickyMobileCTA href="/report" label="Request Demo" />
 */
interface StickyMobileCTAProps {
  href?: string;
  label?: string;
  onClick?: () => void;
}

export default function StickyMobileCTA({
  href = "/report",
  label = "Request Demo",
  onClick,
}: StickyMobileCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <Link
        href={href}
        onClick={onClick}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--brand-blue-light)] px-6 py-4 text-sm font-bold text-white shadow-[0_-4px_20px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
      >
        {label}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
