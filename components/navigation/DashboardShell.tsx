// ---------------------------------------------------------------------
// components/navigation/DashboardShell.tsx
// UI/UX Phase 2 · Step 4 — dashboard layout shell.
//
// Client wrapper that owns the sidebar collapsed state (the server layout
// can't hold state) and composes:
//
//   • fixed DashboardSidebar (260px ⇄ 64px icon rail) — off-screen drawer
//     below md via translate; slides in as an overlay when mobileOpen
//   • sticky DashboardTopBar (utilities: theme/language/avatar/hamburger)
//   • content column whose left margin animates with the collapse state
//     at md+ (ml-[260px] ⇄ ml-16); full-width on phones under the drawer
//   • one-handed mode (Step 10) — when the BottomNav's double-tap fires,
//     the whole content column translates down 25vh (iOS Reachability) so
//     top-of-page controls land in thumb range; double-tap restores. The
//     state lives here because the transform targets this column, while
//     the BottomNav (fixed, outside the column) only reports the gesture.
//
// Breakpoints moved lg → md (768px) Aug 9, 2026 to match the architecture
// doc (drawer + bottom nav on phones; pinned rail on tablet+).
//
// Children (AlertTicker + page) are passed through from the server layout
// and render inside the animated content column.
// ---------------------------------------------------------------------

"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopBar from "./DashboardTopBar";
import BottomNav from "./BottomNav";
import { readSidebarCollapsed } from "./Sidebar";
import { useDemoSimulation } from "@/hooks/useDemoSimulation";
import type { Role } from "@/lib/validations/user";

type DashboardShellProps = {
  /** Guest (demo) mode — passed down to the top bar identity block. */
  guest: boolean;
  /** Active user role — filters the sidebar nav routes (guests get the
   * demo default district_admin via the layout). */
  userRole?: Role;
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
  userRole,
  displayName,
  email,
  avatarUrl,
  alertsBadgeCount,
  children,
}: DashboardShellProps) {
  // Phase 10 · Step 3 — while demo_sim_active is set, inject simulated live
  // data (People-at-Risk bumps + activity logs) into the command center.
  // HeroKPIs and LiveActivityFeed subscribe to its window events.
  useDemoSimulation();

  const [collapsed, setCollapsed] = useState(() => readSidebarCollapsed() ?? false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Step 10 — one-handed (Reachability) mode. Toggled by a double-tap on
  // the mobile BottomNav; slides the content column down 25vh. Auto-exits
  // if the viewport grows to md+ (the BottomNav hides there, so the user
  // would have no way to toggle it back).
  const [oneHanded, setOneHanded] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const resetOnDesktop = () => {
      if (mq.matches) setOneHanded(false);
    };
    resetOnDesktop();
    mq.addEventListener("change", resetOnDesktop);
    return () => mq.removeEventListener("change", resetOnDesktop);
  }, []);

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
        userRole={userRole}
        guest={guest}
        isOpenMobile={mobileOpen}
        onCloseMobile={closeMobile}
      />

      {/* Content column — margin animates 260px ⇄ 64px at md+; full-width
          on phones where the sidebar is a drawer overlay. Bottom padding
          clears the fixed mobile BottomNav (72px + safe area) below md.
          One-handed mode translates the whole column down 25vh (Step 10). */}
      <div
        className={`pb-[calc(72px+env(safe-area-inset-bottom))] transition-all duration-300 motion-reduce:transition-none md:pb-0 ${
          collapsed ? "md:ml-16" : "md:ml-[260px]"
        } ${oneHanded ? "translate-y-[25vh]" : ""}`}
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

      {/* Mobile bottom navigation — hidden at md+ (tablet/desktop uses the
          sidebar). Double-tapping its background toggles one-handed mode (Step 10). */}
      <BottomNav
        alertsBadgeCount={alertsBadgeCount}
        oneHanded={oneHanded}
        onToggleOneHanded={() => setOneHanded((v) => !v)}
      />
    </div>
  );
}

export default DashboardShell;
