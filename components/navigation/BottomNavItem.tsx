"use client";

// ---------------------------------------------------------------------
// components/navigation/BottomNavItem.tsx
// UI/UX Phase 3 · Step 2 — single bottom-nav tab.
//
// Layout: flex column, centered — 24px icon (stroke-width 1.5) on top,
// 10px label below.
//
//   • Active   — icon glyph filled with --accent-primary (stroke keeps the
//     accent, so the filled silhouette reads on the dark bar), label
//     rendered bright white (--text-primary), and a 2px accent line pinned
//     to the absolute top of the item.
//   • Inactive — outline icon + label in --text-muted.
//
// Rendered as a <button> so the shell owns navigation (router.push).
// Optional notification badge: a tiny dot pinned to the icon's top-right —
// when badgeCount > 0 the dot grows into a number pill (text-[0.5rem]) in
// badgeColor.
// ---------------------------------------------------------------------

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";

type BottomNavItemProps = {
  /** Lucide icon to render for the tab. */
  icon: LucideIcon;
  /** Label under the icon. */
  label: string;
  /** Active tab styling (accent fill + line, bright label). */
  isActive: boolean;
  /** Click handler — the shell passes router navigation. */
  onClick: () => void;
  /**
   * Notification badge. Present → renders a dot at the icon's top-right;
   * > 0 → the dot shows the count inside (very small text).
   */
  badgeCount?: number;
  /** Dot/pill fill, e.g. "bg-red-500" or "bg-amber-500". Defaults to rose. */
  badgeColor?: string;
};

export function BottomNavItem({
  icon: Icon,
  label,
  isActive,
  onClick,
  badgeCount,
  badgeColor = "bg-rose-500",
}: BottomNavItemProps) {
  const iconStyle: CSSProperties | undefined = isActive
    ? { fill: "var(--accent-primary)", stroke: "var(--accent-primary)" }
    : undefined;

  const activeLine = (
    <span
      aria-hidden
      className={`absolute top-0 h-[2px] w-8 rounded-full bg-[var(--accent-primary)] transition-opacity duration-150 motion-reduce:transition-none ${
        isActive ? "opacity-100" : "opacity-0"
      }`}
    />
  );

  const badge =
    badgeCount !== undefined ? (
      <span
        aria-hidden={badgeCount <= 0}
        aria-label={badgeCount > 0 ? `${label}: ${badgeCount} new items` : undefined}
        className={`absolute -right-1.5 -top-1 flex items-center justify-center rounded-full font-bold leading-none text-white ${badgeColor} ${
          badgeCount > 0 ? "h-4 min-w-4 px-1 text-[0.5rem]" : "h-2 w-2"
        }`}
      >
        {badgeCount > 0 ? (badgeCount > 99 ? "99+" : String(badgeCount)) : null}
      </span>
    ) : null;

  return (
    <button
      type="button"
      onClick={() => {
        // Physical confirmation (Step 8) — every tab tap buzzes.
        triggerLightHaptic();
        onClick();
      }}
      aria-current={isActive ? "page" : undefined}
      aria-label={isActive ? `${label} (current page)` : label}
      className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-md outline-none transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/40 ${
        isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
      }`}
    >
      {activeLine}
      <span className="relative flex items-center justify-center">
        <Icon className="h-6 w-6" strokeWidth={1.5} style={iconStyle} aria-hidden />
        {badge}
      </span>
      <span className="truncate text-[0.625rem] font-semibold">{label}</span>
    </button>
  );
}

export default BottomNavItem;
