"use client";

// ---------------------------------------------------------------------
// components/ui/Card.tsx — UI/UX Phase 1 · Prompt 1.4
//
// Canonical card/panel component with:
//   - Compact density (tighter padding for dashboards)
//   - Comfortable density (standard padding for settings/forms)
//   - Optional header with title + action slot
//   - Optional footer
//   - Framer Motion hover-lift effect
//   - Consistent border, background, and shadow tokens
// ---------------------------------------------------------------------

import { type ReactNode } from "react";
import { motion } from "framer-motion";

export interface CardProps {
  /** Card content. */
  children: ReactNode;
  /** Card title — shown in the header. */
  title?: string;
  /** Optional action element (button, link) shown in the header. */
  action?: ReactNode;
  /** Optional footer content. */
  footer?: ReactNode;
  /** Padding density preset. */
  density?: "compact" | "comfortable";
  /** Whether to show the hover-lift effect. */
  hoverable?: boolean;
  /** Additional className for the card container. */
  className?: string;
  /** Additional className for the card body. */
  bodyClassName?: string;
}

const DENSITY_CLASSES = {
  compact: "p-3",
  comfortable: "p-5",
} as const;

export function Card({
  children,
  title,
  action,
  footer,
  density = "comfortable",
  hoverable = false,
  className = "",
  bodyClassName = "",
}: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2 } : undefined}
      transition={hoverable ? { type: "spring" as const, stiffness: 400, damping: 25 } : undefined}
      className={`overflow-hidden rounded-xl border border-panel-border bg-[var(--bg-secondary)] shadow-card ${className}`}
    >
      {/* Header */}
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-panel-border px-5 py-3">
          {title && (
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Body */}
      <div className={`${DENSITY_CLASSES[density]} ${bodyClassName}`}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-panel-border px-5 py-3">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

export default Card;
