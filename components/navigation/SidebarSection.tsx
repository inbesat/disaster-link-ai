// ---------------------------------------------------------------------
// components/navigation/SidebarSection.tsx
// UI/UX Phase 2 · Step 2 — nav section wrapper.
//
// Renders a muted, uppercase, tracking-wider section label (e.g.
// "OPERATIONS") above a group of SidebarNavItems. The label is hidden
// while the sidebar is collapsed — a subtle divider keeps consecutive
// sections distinguishable in the icon rail, and the items' tooltips
// take over.
// ---------------------------------------------------------------------

"use client";

import type { ReactNode } from "react";
import { useSidebar } from "./sidebar-context";

type SidebarSectionProps = {
  /** Section label, e.g. "Operations". Rendered uppercase + muted. */
  label: string;
  /** SidebarNavItems (or other content) in this section. */
  children: ReactNode;
  className?: string;
};

export function SidebarSection({ label, children, className = "" }: SidebarSectionProps) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={`${collapsed ? "mt-3 border-t border-subtle pt-3 first:mt-0 first:border-t-0 first:pt-0" : ""} ${className}`}
    >
      {!collapsed && (
        <p className="px-3 pb-2 pt-4 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default SidebarSection;
