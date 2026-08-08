// ---------------------------------------------------------------------
// components/navigation/Sidebar.tsx
// UI/UX Phase 2 · Step 1 — the sidebar shell.
//
// Fixed left container, full viewport height, roadmap --bg-secondary
// surface. Width animates 260px (expanded) ⇄ 64px (collapsed) via
// transition-all duration-300. The collapse toggle (chevron) sits in a
// footer strip near the bottom; nav items render in the scrollable
// middle region (added by the Phase 2 · Step 2 nav-links step).
//
// State: uncontrolled by default (internal useState) — or controlled by
// passing `collapsed` + `onToggle` so parents can sync (e.g. content
// margin). `variant="inline"` renders in-flow for demos/embeds instead of
// pinning to the viewport.
// ---------------------------------------------------------------------

"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import SidebarContext from "@/components/navigation/sidebar-context";
import SidebarHeader from "@/components/navigation/SidebarHeader";

export type SidebarVariant = "fixed" | "inline";

type SidebarProps = {
  /** Nav links / sections rendered in the scrollable middle region. */
  children?: ReactNode;
  /** Controlled collapsed state — omit for internal state. */
  collapsed?: boolean;
  /** Callback when the toggle is pressed (controlled mode). */
  onToggle?: () => void;
  /** Initial state for the uncontrolled mode. */
  defaultCollapsed?: boolean;
  /** fixed: pins to the viewport · inline: in-flow (styleguide demo). */
  variant?: SidebarVariant;
  className?: string;
};

const EXPANDED_WIDTH = "w-[260px]";
const COLLAPSED_WIDTH = "w-16"; // 64px

export function Sidebar({
  children,
  collapsed,
  onToggle,
  defaultCollapsed = false,
  variant = "fixed",
  className = "",
}: SidebarProps) {
  const isControlled = collapsed !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = isControlled ? collapsed : internalCollapsed;

  const toggle = () => {
    if (isControlled) onToggle?.();
    else setInternalCollapsed((c) => !c);
  };

  // Phase 2 · Step 4 — accordion parents call this when opened from the
  // collapsed rail so their children become visible. Only expands (never
  // collapses) regardless of controlled/uncontrolled mode.
  const expand = () => {
    if (isControlled) {
      if (collapsed) onToggle?.();
    } else {
      setInternalCollapsed(false);
    }
  };

  return (
    <SidebarContext.Provider value={{ collapsed: isCollapsed, expand }}>
      <aside
        id="app-sidebar"
        aria-label="Command center navigation"
        className={`flex h-screen flex-col border-r border-subtle bg-secondary transition-all duration-300 motion-reduce:transition-none ${
          variant === "fixed" ? "fixed inset-y-0 left-0 z-40" : "relative h-full"
        } ${isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH} ${className}`}
      >
        <SidebarHeader expanded={!isCollapsed} />

        {/* Scrollable middle region — nav links mount here (Phase 2 · Step 2). */}
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {children}
        </nav>

        {/* Footer — collapse toggle near the bottom */}
        <div
          className={`flex shrink-0 items-center border-t border-subtle p-2 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!isCollapsed && (
            <span className="pl-2 text-[11px] font-medium uppercase tracking-widest text-muted">
              Collapse
            </span>
          )}
          <IconButton
            label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            variant="ghost"
            size="md"
            aria-expanded={!isCollapsed}
            aria-controls="app-sidebar"
            onClick={toggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden />
            )}
          </IconButton>
        </div>
      </aside>
    </SidebarContext.Provider>
  );
}

export default Sidebar;
