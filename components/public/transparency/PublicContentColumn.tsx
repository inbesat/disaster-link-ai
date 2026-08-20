"use client";

// ---------------------------------------------------------------------
// components/public/transparency/PublicContentColumn.tsx — column
// wrapper for the citizen dashboard content.
//
// Carries the dashboard's responsive column classes (max-w-7xl,
// mobile bottom padding, md:py-10). The transparency drawer is now a
// full-height overlay (z-[70]) so no margin reservation is needed —
// the content uses the full width at all times.
//
// Children are passed through from the server page (RSC composition),
// so the whole subtree stays server-rendered.
// ---------------------------------------------------------------------

import { type ReactNode } from "react";

export default function PublicContentColumn({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-6 pb-[calc(88px+env(safe-area-inset-bottom))] md:py-10">
      {children}
    </div>
  );
}
