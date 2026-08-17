// ---------------------------------------------------------------------
// components/navigation/SidebarNavItem.tsx
// UI/UX Phase 2 · Step 2 — single nav link (+ Step 4 accordion support).
//
//   • Active     — left accent border (border-l-2) + accent tint +
//                  accent-colored icon, aria-current="page"
//   • Hover      — subtle white/5 background tint
//   • Collapsed  — label + badge hidden, icon-only link with a hover /
//                  focus-visible tooltip so the destination stays
//                  discoverable
//   • Badge      — optional count pill (99+ overflow, hidden at 0)
//   • subRoutes  — optional sub-route array (named `subRoutes`, NOT React
//                  children — satisfies the react/no-children-prop lint
//                  rule). When present the row becomes an accordion
//                  parent: a ChevronDown appears on the right (rotates
//                  180° when open), clicking toggles the nested sub-menu,
//                  and the parent counts as active when either its own
//                  href or any child href matches the route. Opening a
//                  parent from the collapsed 64px rail calls `expand()`
//                  so the children can actually be seen.
//
// Active state auto-derives from the current route (usePathname) unless
// an explicit `active` prop is passed. When the sidebar collapses, open
// sub-menus close automatically.
//
// Tooltip note: the nav region is a scroll container (overflow-x-hidden),
// and the tooltip's containing block (this row) lives inside it — so a
// plain `absolute left-full` tooltip would be clipped at the 64px rail
// edge. Instead the tooltip is measured via getBoundingClientRect() and
// rendered with `position: fixed` (viewport coordinates), which escapes
// every ancestor's overflow clip. Both the real fixed sidebar and the
// inline styleguide demo are covered.
// ---------------------------------------------------------------------

"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSidebar } from "./sidebar-context";

/** A nested entry rendered under an accordion parent. */
export type SidebarSubRoute = {
  /** Accessible label for the sub-link. */
  label: string;
  /** Destination route. */
  href: string;
  /** Optional count pill (hidden at 0, "99+" above 99). */
  badgeCount?: number;
};

type SidebarNavItemProps = {
  /** Lucide icon for the row. */
  icon: LucideIcon;
  /** Accessible label — also shown as the tooltip when collapsed. */
  label: string;
  /** Destination route (also used for active matching on the parent). */
  href: string;
  /** Optional count pill (renders "99+" above 99, hidden at 0). */
  badgeCount?: number;
  /** Explicit active state — auto-derived from `href` when omitted. */
  active?: boolean;
  /** Optional sub-routes. When present, the row becomes an accordion
   * parent: clicking toggles the nested menu instead of navigating.
   * Named `subRoutes` (not `children`) so the react/no-children-prop
   * lint rule doesn't fire — these are data, not React children.
   */
  subRoutes?: SidebarSubRoute[];
  /** Optional keyboard short-circuit hint, e.g. "⌘1". Rendered as a
   * muted <kbd> on the right side of the label (expanded only). */
  shortcut?: string;
  className?: string;
};

/** Route match: exact for "/", prefix match (segment-aware) otherwise. */
function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function formatCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

type TipPosition = { top: number; left: number };

export function SidebarNavItem({
  icon: Icon,
  label,
  href,
  badgeCount,
  active,
  subRoutes,
  shortcut,
  className = "",
}: SidebarNavItemProps) {
  const { collapsed, expand } = useSidebar();
  const pathname = usePathname();
  const hasChildren = subRoutes !== undefined && subRoutes.length > 0;

  // Step 4 — accordion state. Auto-open on first paint when a child route
  // is the current page (e.g. landing on /settings/profile opens Settings).
  const subMenuId = useId();
  const [open, setOpen] = useState(
    () =>
      hasChildren &&
      (subRoutes?.some((child) => isPathActive(pathname, child.href)) ?? false),
  );

  // A parent counts as active when its own href OR any child matches.
  const isActive =
    active ??
    (hasChildren
      ? isPathActive(pathname, href) ||
        (subRoutes?.some((child) => isPathActive(pathname, child.href)) ?? false)
      : isPathActive(pathname, href));

  // Position persists across show/hide so the fade-out happens in place;
  // visibility is a separate flag (a shared state would teleport the
  // tooltip to (0,0) to fade there on pointerleave).
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [tipPos, setTipPos] = useState<TipPosition | null>(null);
  const [tipVisible, setTipVisible] = useState(false);

  // Drop any stale tip when the sidebar expands (labels reappear); close
  // open sub-menus when the sidebar collapses to the icon rail.
  useEffect(() => {
    if (!collapsed) {
      setTipVisible(false);
      setTipPos(null);
    } else {
      setOpen(false);
    }
  }, [collapsed]);

  // Open-only sync: when navigation lands on one of this parent's child
  // routes, expand the accordion so the active link is visible (doesn't
  // force-close after the user manually collapses it).
  useEffect(() => {
    if (hasChildren && subRoutes?.some((child) => isPathActive(pathname, child.href))) {
      setOpen(true);
    }
  }, [pathname, subRoutes, hasChildren]);

  const showTip = () => {
    if (!collapsed) return;
    const el = linkRef.current ?? buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTipPos({ top: r.top + r.height / 2, left: r.right + 12 });
    setTipVisible(true);
  };

  const hideTip = () => setTipVisible(false);

  // Step 4 — accordion parent click: toggle the sub-menu, and force the
  // sidebar to expand first when it is a 64px rail so the children fit.
  const handleParentClick = () => {
    if (collapsed) expand();
    setOpen((o) => !o);
  };

  const rowClassName = `relative flex h-11 items-center gap-3 rounded-md border-l-2 px-3 text-sm transition-colors duration-150 motion-reduce:transition-none ${
    collapsed ? "justify-center px-0" : ""
  } ${
    isActive
      ? "border-accent-primary bg-accent-primary/10 text-primary"
      : "border-transparent text-muted hover:bg-white/5 hover:text-foreground"
  } ${className}`;

  // Shared row body: icon, label, badge pill, optional chevron, tooltip.
  const rowBody = (
    <>
      <Icon
        className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-accent-primary" : ""}`}
        aria-hidden
      />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && badgeCount !== undefined && badgeCount > 0 && (
        <span className="shrink-0 rounded-full bg-accent-primary/15 px-1.5 py-px text-[0.625rem] font-bold leading-4 text-accent-primary tabular-nums">
          {formatCount(badgeCount)}
        </span>
      )}
      {!collapsed && shortcut && (
        <kbd
          aria-hidden
          className="shrink-0 rounded border border-subtle bg-tertiary px-1.5 py-0.5 font-mono text-[0.625rem] font-medium text-muted"
        >
          {shortcut}
        </kbd>
      )}
      {!collapsed && hasChildren && (
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      )}
      {collapsed && (
        <span
          role="tooltip"
          style={{ top: tipPos?.top ?? 0, left: tipPos?.left ?? 0 }}
          className={`pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-subtle bg-tertiary px-2.5 py-1.5 text-xs font-medium text-primary shadow-card transition-opacity duration-150 motion-reduce:transition-none ${
            tipVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {label}
        </span>
      )}
    </>
  );

  // Accordion parent — a <button> so clicking toggles instead of navigating.
  if (hasChildren) {
    return (
      <>
        <button
          type="button"
          ref={buttonRef}
          aria-expanded={open}
          aria-controls={subMenuId}
          aria-label={collapsed ? label : undefined}
          onPointerEnter={showTip}
          onPointerLeave={hideTip}
          onFocus={showTip}
          onBlur={hideTip}
          onClick={handleParentClick}
          className={`${rowClassName} w-full text-left`}
        >
          {rowBody}
        </button>

        {/* Nested sub-menu — only rendered while the sidebar is expanded */}
        {open && !collapsed && (
          <ul id={subMenuId} className="space-y-0.5 pb-1 pt-0.5">
            {subRoutes!.map((sub) => {
              const subActive = isPathActive(pathname, sub.href);
              return (
                <li key={sub.href}>
                  <Link
                    href={sub.href}
                    aria-current={subActive ? "page" : undefined}
                    className={`flex min-h-[44px] items-center gap-2 rounded-md border-l-2 pl-[42px] pr-2 text-[0.8125rem] transition-colors duration-150 motion-reduce:transition-none ${
                      subActive
                        ? "border-accent-primary bg-accent-primary/10 text-primary"
                        : "border-transparent text-muted hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{sub.label}</span>
                    {sub.badgeCount !== undefined && sub.badgeCount > 0 && (
                      <span className="shrink-0 rounded-full bg-accent-primary/15 px-1.5 py-px text-[0.625rem] font-bold leading-4 text-accent-primary tabular-nums">
                        {formatCount(sub.badgeCount)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  return (
    <Link
      ref={linkRef}
      href={href}
      aria-label={collapsed ? label : undefined}
      aria-current={isActive ? "page" : undefined}
      onPointerEnter={showTip}
      onPointerLeave={hideTip}
      onFocus={showTip}
      onBlur={hideTip}
      className={rowClassName}
    >
      {rowBody}
    </Link>
  );
}

export default SidebarNavItem;
