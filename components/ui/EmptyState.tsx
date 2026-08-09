"use client";

import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type EmptyStateProps = {
  /** Icon to show large + faded in the center. Defaults to a generic inbox. */
  icon?: LucideIcon;
  /** Short, bold call-to-action label — e.g. "No alerts on record". */
  title: string;
  /** One or two sentences explaining what belongs here / how to fix it. */
  description?: string;
  /** Optional action (e.g. a "+ Add First Resource" button). */
  actionButton?: ReactNode;
  /** Extra classes (e.g. rounding/padding overrides for table cells). */
  className?: string;
  /** Size (px) of the faded center icon. Default 44. */
  iconSize?: number;
};

/**
 * Phase 8 · Step 5 — polished empty-state placeholder.
 *
 * Used by tables and feeds when their data array is empty or fully filtered
 * out (Alert History, Resource Inventory, …). Muted monochrome slot: dashed
 * border, transparent surface, large faded icon — reads as "this is where
 * data will land" rather than a broken render. Fades in slowly on mount so
 * it never jarringly flashes before live data replaces it.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionButton,
  className = "",
  iconSize = 44,
}: EmptyStateProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
      className={`flex flex-col items-center justify-center gap-4 rounded-eoc border border-dashed border-border/70 bg-transparent px-6 py-12 text-center ${className}`}
    >
      {/* Large faded icon */}
      <Icon
        className="text-muted"
        style={{ width: iconSize, height: iconSize }}
        strokeWidth={1.25}
        aria-hidden
      />

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
          {title}
        </h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>

      {actionButton}
    </motion.div>
  );
}

export default EmptyState;
