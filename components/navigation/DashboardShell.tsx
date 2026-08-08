// ---------------------------------------------------------------------
// components/navigation/DashboardShell.tsx
// UI/UX Phase 2 · Step 4 — dashboard layout shell.
//
// Client wrapper that owns the sidebar collapsed state (the server layout
// can't hold state) and composes:
//
//   • fixed DashboardSidebar (260px ⇄ 64px icon rail) — hidden below md
//     (the top bar keeps the mobile hamburger menu, same as before)
//   • sticky DashboardTopBar (utilities: theme/language/avatar/…)
//   • content column whose left margin animates with the collapse state
//     (ml-[260px] ⇄ ml-16 at md+), so the map/dashboards reflow smoothly
//
// Children (AlertTicker + page) are passed through from the server layout
// and render inside the animated content column.
// ---------------------------------------------------------------------

"use client";

import { useState, type ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopBar from "./DashboardTopBar";

type DashboardShellProps = {
  /** Guest (demo) mode — passed down to the top bar identity block. */
  guest: boolean;
  /** Resolved display name ("Guest Commander" in demo mode). */
  displayName: string;
  /** User email (null in demo mode). */
  email: string | null;
  /** Server-provided avatar URL. */
  avatarUrl: string | null;
  /** Unacknowledged AlertLog count — renders the sidebar Active Alerts pill. */
  alertsBadgeCount?: number;
  /** AlertTicker + page content, passed through from the server layout. */
  children: ReactNode;
};

export function DashboardShell({
  guest,
  displayName,
  email,
  avatarUrl,
  alertsBadgeCount,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Fixed sidebar — hidden below md via a plain wrapper (avoids the
          flex-vs-hidden stylesheet-order trap); the top bar's hamburger
          menu covers mobile navigation. */}
      <div className="hidden md:block">
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          alertsBadgeCount={alertsBadgeCount}
        />
      </div>

      {/* Content column — margin animates 260px ⇄ 64px with the collapse */}
      <div
        className={`transition-all duration-300 motion-reduce:transition-none ${
          collapsed ? "md:ml-16" : "md:ml-[260px]"
        }`}
      >
        <DashboardTopBar
          guest={guest}
          displayName={displayName}
          email={email}
          avatarUrl={avatarUrl}
        />
        {children}
      </div>
    </div>
  );
}

export default DashboardShell;
