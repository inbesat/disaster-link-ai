"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------
// components/ui/SkipToContent.tsx — Phase 17 · Step 4.
//
// "Skip to main content" link for keyboard users.
//   • Visible only on Tab focus (first element in tab order)
//   • Hidden by default (sr-only + focus:not-sr-only)
//   • Links to #main-content anchor
//   • Positioned at top-left with high z-index
// ---------------------------------------------------------------------

export function SkipToContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[9999] rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] sr-only focus:not-sr-only"
    >
      Skip to main content
    </a>
  );
}

export default SkipToContent;
