// ---------------------------------------------------------------------
// components/navigation/sidebar-context.ts
// UI/UX Phase 2 · Step 2 — shared collapsed-state context (+ Step 4
// expand() for accordion parents).
//
// SidebarSection / SidebarNavItem need to know whether the sidebar is
// collapsed to hide labels / show tooltips, but the collapsed state lives
// inside <Sidebar> (uncontrolled or controlled). This tiny context lets
// the nav atoms auto-adapt without prop-threading. Outside a <Sidebar>,
// useSidebar() degrades gracefully to `expanded` (no label hiding), so
// the atoms can also be showcased standalone in the styleguide.
//
// Phase 2 · Step 4 adds `expand()`: when a nav item with a sub-menu is
// clicked while the sidebar is a 64px icon rail, the item calls expand()
// to force the shell back to 260px so the children can be seen.
// ---------------------------------------------------------------------

"use client";

import { createContext, useContext } from "react";

type SidebarContextValue = {
  /** True when the sidebar is collapsed to the 64px icon rail. */
  collapsed: boolean;
  /**
   * Force the sidebar shell to expand (used by accordion parents opened
   * from the collapsed rail). No-op outside a <Sidebar> or when already
   * expanded.
   */
  expand: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const DEFAULT_CONTEXT: SidebarContextValue = {
  collapsed: false,
  expand: () => {},
};

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  return ctx ?? DEFAULT_CONTEXT;
}

export default SidebarContext;
