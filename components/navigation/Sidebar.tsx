// ---------------------------------------------------------------------
// components/navigation/Sidebar.tsx
// UI/UX Phase 2 · Step 10 (finalized) — the sidebar shell.
//
// Fixed left container, full viewport height, roadmap --bg-secondary
// surface. Width animates 260px (expanded) ⇄ 64px (collapsed) on tablet+
// (md+, 768px) via transition-all duration-300. Below md it becomes a
// mobile drawer: hidden off-screen by default (-translate-x-full),
// sliding in (translate-x-0) as a fixed overlay with a darkened backdrop
// when `isOpenMobile` is set. The collapse toggle (chevron) sits in a
// footer strip near the bottom (tablet+ only); nav items render in the
// scrollable middle region.
//
// Breakpoint: the mobile drawer / pinned sidebar switch is md (768px) per
// the architecture doc — tablets get the pinned rail, phones get the
// drawer + bottom nav. (Was lg until the Aug 9, 2026 alignment — see
// docs/CONTEXT_HANDOFF.md audit pass.)
//
// State: uncontrolled by default (internal useState) — or controlled by
// passing `collapsed` + `onToggle` so parents can sync (e.g. content
// margin). Desktop collapse state persists to localStorage (reads on
// mount so it doesn't jump on refresh, writes on every change) — reuse
// readSidebarCollapsed() in a controlled parent to seed its initial
// value from the same store. `variant="inline"` renders in-flow for
// demos/embeds instead of pinning to the viewport (no persistence, no
// drawer).
// ---------------------------------------------------------------------

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import SidebarContext from "@/components/navigation/sidebar-context";
import SidebarHeader from "@/components/navigation/SidebarHeader";
import QuickActions from "@/components/navigation/QuickActions";

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
  /** Mobile drawer open — slides the (fixed) sidebar in over content. */
  isOpenMobile?: boolean;
  /** Close the mobile drawer (backdrop click / Escape). */
  onCloseMobile?: () => void;
  className?: string;
};

const SIDEBAR_COLLAPSED_KEY = "drip:sidebar-collapsed";

const EXPANDED_WIDTH = "w-[260px]";
const COLLAPSED_WIDTH = "w-[260px] md:w-16"; // drawer keeps 260px on phones

/** Read the persisted desktop collapse state (call on mount, client-side). */
export function readSidebarCollapsed(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return raw === null ? null : raw === "1";
  } catch {
    return null;
  }
}

/** Persist the desktop collapse state (fire-and-forget; storage may be off). */
export function writeSidebarCollapsed(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    // private mode / quota — non-critical, skip
  }
}

/** True once the viewport reaches the tablet breakpoint (md = 768px) —
 * above it the sidebar pins/collapses; below it the drawer + bottom nav. */
function useIsTabletUp(): boolean {
  const [isTabletUp, setIsTabletUp] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsTabletUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isTabletUp;
}

export function Sidebar({
  children,
  collapsed,
  onToggle,
  defaultCollapsed = false,
  variant = "fixed",
  isOpenMobile = false,
  onCloseMobile,
  className = "",
}: SidebarProps) {
  const isControlled = collapsed !== undefined;
  const isTabletUp = useIsTabletUp();

  // Uncontrolled mode: lazy-init from localStorage so a refresh keeps the
  // user's collapsed/expanded choice (client render → no flash after mount).
  const [internalCollapsed, setInternalCollapsed] = useState(() =>
    variant === "fixed" ? (readSidebarCollapsed() ?? defaultCollapsed) : defaultCollapsed,
  );
  const isCollapsed = isControlled ? collapsed : internalCollapsed;

  // The mobile drawer is always full (labels visible); collapse only bites
  // on tablet+. Expose the effective value via the context.
  const effectiveCollapsed = isTabletUp ? isCollapsed : false;

  const toggle = () => {
    if (isControlled) onToggle?.();
    else setInternalCollapsed((c) => !c);
  };

  // Persist on every desktop state change (works for both controlled and
  // uncontrolled — the parent shells seed their initial read the same way).
  useEffect(() => {
    if (variant === "fixed" && isTabletUp) writeSidebarCollapsed(isCollapsed);
  }, [variant, isTabletUp, isCollapsed]);

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

  const drawerOpen = variant === "fixed" && isOpenMobile && !isTabletUp;

  // Close the drawer on Escape + lock body scroll while it's open.
  const onCloseRef = useRef(onCloseMobile);
  onCloseRef.current = onCloseMobile;
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <SidebarContext.Provider value={{ collapsed: effectiveCollapsed, expand }}>
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
      <aside
        id="app-sidebar"
        aria-label="Command center navigation"
        className={`flex h-screen flex-col border-r border-subtle bg-secondary transition-all duration-300 motion-reduce:transition-none ${
          variant === "fixed"
            ? `fixed inset-y-0 left-0 z-40 ${
                drawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
              }`
            : "relative h-full"
        } ${effectiveCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH} ${className}`}
      >
        <SidebarHeader expanded={!effectiveCollapsed} />

        {/* Scrollable middle region — nav links mount here (Phase 2 · Step 2). */}
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {children}
        </nav>

        {/* Quick actions — emergency one-click shortcuts; self-hides at the
            64px rail via the shared sidebar context (Phase 2 · Step 8). */}
        <QuickActions />

        {/* Footer — collapse toggle (tablet+ only; the drawer is always
            expanded, so the chevron is hidden below md). */}
        <div
          className={`hidden md:flex shrink-0 items-center border-t border-subtle p-2 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!isCollapsed && (
            <span className="pl-2 text-[0.6875rem] font-medium uppercase tracking-widest text-muted">
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
