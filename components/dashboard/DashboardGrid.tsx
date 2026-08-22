"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { dashboardGrid } from "@/styles/tokens";

// ---------------------------------------------------------------------
// components/dashboard/DashboardGrid.tsx — UI/UX Phase 8 · Step 2 + Step 10.
// Prompt 1.5 — Standardized responsive grid with 8px gap system.
//
// The Command Center's responsive widget grid with stagger animation.
// Uses the canonical dashboard grid breakpoints:
//   Mobile:  1 column,  gap 16px
//   Tablet:  2 columns, gap 20px
//   Desktop: 3 columns, gap 24px
//   Wide:    4 columns, gap 24px
// ─────────────────────────────────────────────────────────────────────

const gridContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const gridItem: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/** Reduced-motion equivalents — instant opacity only, no stagger/translate. */
const fadeContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0,
      delayChildren: 0,
    },
  },
};

const fadeItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0 } },
};

type DashboardGridItem = {
  key: string;
  /** Responsive grid placement for this cell (e.g. "md:col-span-2 xl:col-span-8"). */
  className?: string;
  children: ReactNode;
};

type DashboardGridProps = {
  /** Widgets in visual build order — top-left → bottom-right. */
  items: DashboardGridItem[];
  /** Override the default column span for all items. */
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
};

/**
 * Generate responsive grid-cols class from column counts.
 * Maps to: grid-cols-{mobile} sm:grid-cols-{mobile} md:grid-cols-{tablet} lg:grid-cols-{desktop} xl:grid-cols-{wide}
 */
function getGridColsClass(columns: DashboardGridProps["columns"]): string {
  const m = columns?.mobile ?? dashboardGrid.mobile.columns;
  const t = columns?.tablet ?? dashboardGrid.tablet.columns;
  const d = columns?.desktop ?? dashboardGrid.desktop.columns;
  const w = columns?.wide ?? dashboardGrid.wide.columns;
  return `grid-cols-${m} md:grid-cols-${t} lg:grid-cols-${d} xl:grid-cols-${w}`;
}

/**
 * Canonical responsive gap — token-driven rhythm (16 / 20 / 24 / 24 px).
 * Gap intentionally does NOT scale from the `columns` prop: column counts
 * and spacing are independent concerns.
 */
const CANONICAL_GAP_CLASS = "gap-4 md:gap-5 lg:gap-6 xl:gap-6";

export function DashboardGrid({ items, columns }: DashboardGridProps) {
  const reduceMotion = useReducedMotion();
  const container = reduceMotion ? fadeContainer : gridContainer;
  const itemVariants = reduceMotion ? fadeItem : gridItem;

  const gridColsClass = getGridColsClass(columns);
  const gapClass = CANONICAL_GAP_CLASS;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`mt-6 grid w-full grid-flow-row-dense items-start ${gridColsClass} ${gapClass}`}
    >
      {items.map(({ key, className = "", children }) => (
        <motion.div key={key} variants={itemVariants} className={className}>
          {children}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default DashboardGrid;
