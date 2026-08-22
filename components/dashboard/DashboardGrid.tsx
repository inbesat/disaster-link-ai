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
 * Generate responsive gap class from gap values.
 * Maps to: gap-{mobile} md:gap-{tablet} lg:gap-{desktop} xl:gap-{wide}
 * Uses Tailwind's gap scale: gap-4=16px, gap-5=20px, gap-6=24px
 */
function getGapClass(columns: DashboardGridProps["columns"]): string {
  const m = columns?.mobile ? `gap-[${columns.mobile * 4}px]` : "gap-4";
  const t = columns?.tablet ? `gap-[${columns.tablet * 4}px]` : "gap-5";
  const d = columns?.desktop ? `gap-[${columns.desktop * 4}px]` : "gap-6";
  const w = columns?.wide ? `gap-[${columns.wide * 4}px]` : "gap-6";
  return `${m} md:${t} lg:${d} xl:${w}`;
}

export function DashboardGrid({ items, columns }: DashboardGridProps) {
  const reduceMotion = useReducedMotion();
  const container = reduceMotion ? fadeContainer : gridContainer;
  const itemVariants = reduceMotion ? fadeItem : gridItem;

  const gridColsClass = getGridColsClass(columns);
  const gapClass = columns ? getGapClass(columns) : "gap-4 md:gap-5 lg:gap-6 xl:gap-6";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`mt-6 grid ${gridColsClass} ${gapClass}`}
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
