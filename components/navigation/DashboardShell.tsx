// ---------------------------------------------------------------------
// components/navigation/DashboardShell.tsx
// UI/UX Phase 2 · Step 4 — dashboard layout shell.
//
// Client wrapper that owns the sidebar collapsed state (the server layout
// can't hold state) and composes:
//
//   • fixed DashboardSidebar (260px ⇄ 64px icon rail) — off-screen drawer
//     below lg via translate; slides in as an overlay when mobileOpen
//   • sticky DashboardTopBar (utilities: theme/language/avatar/hamburger)
//   • content column whose left margin animates with the collapse state
//     at lg+ (ml-[260px] ⇄ ml-16); full-width on mobile under the drawer
//
// Children (AlertTicker + page) are passed through from the server layout
// and render inside the animated content column.
// ---------------------------------------------------------------------

"use client";

import { useCallback, useState, type ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopBar from "./DashboardTopBar";
import BottomNav from "./BottomNav";
import { readSidebarCollapsed } from "./Sidebar";

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
  const [collapsed, setCollapsed] = useState(() => readSidebarCollapsed() ?? false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen">
      {/* Fixed sidebar — hidden off-screen via translate below lg; slides
          in as an overlay drawer when mobileOpen (the top bar's hamburger
          opens it and the backdrop / top bar route clicks close it). */}
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        alertsBadgeCount={alertsBadgeCount}
        isOpenMobile={mobileOpen}
        onCloseMobile={closeMobile}
      />

      {/* Content column — margin animates 260px ⇄ 64px at lg+; full-width
          on mobile where the sidebar is a drawer overlay. Bottom padding
          clears the fixed mobile BottomNav (72px + safe area) below lg. */}
      <div
        className={`pb-[calc(72px+env(safe-area-inset-bottom))] transition-all duration-300 motion-reduce:transition-none lg:pb-0 ${
          collapsed ? "lg:ml-16" : "lg:ml-[260px]"
        }`}
      >
        <DashboardTopBar
          guest={guest}
          displayName={displayName}
          email={email}
          avatarUrl={avatarUrl}
          onOpenMobile={() => setMobileOpen(true)}
        />
        {children}
      </div>

      {/* Mobile bottom navigation — hidden at lg+ (desktop uses the sidebar). */}
      <BottomNav alertsBadgeCount={alertsBadgeCount} />
    </div>
  );
}

export default DashboardShell;
