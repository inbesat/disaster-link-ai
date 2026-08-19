"use client";

// ---------------------------------------------------------------------
// components/public/transparency/PublicContentColumn.tsx — client column
// wrapper for the citizen dashboard content.
//
// Serves two jobs: it carries the dashboard's responsive column classes
// (max-w-7xl, mobile bottom padding, md:py-10) and it reserves the
// desktop right rail on lg+ via lg:mr-[360px] — but ONLY while the
// transparency drawer is open. When the drawer is closed the reservation
// is dropped so the dashboard expands to the full viewport instead of
// leaving a dead 360px gap on the right.
//
// Children are passed through from the server page (RSC composition), so
// the whole subtree stays server-rendered.
// ---------------------------------------------------------------------

import { type ReactNode } from "react";
import { useTransparencyPanel } from "./TransparencyPanelContext";

export default function PublicContentColumn({ children }: { children: ReactNode }) {
  const { isOpen } = useTransparencyPanel();

  return (
    <div
      className={`relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-6 pb-[calc(88px+env(safe-area-inset-bottom))] md:py-10 ${
        isOpen ? "lg:mr-[360px]" : ""
      }`}
    >
      {children}
    </div>
  );
}
