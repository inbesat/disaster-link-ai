"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ---------------------------------------------------------------------
// components/ui/Panel.tsx — UI/UX Phase 1 · Step 5 (+ Phase 8 · Step 3).
//
// Universal container: bg-secondary surface, radius-lg, shadow-card.
//   • header — optional title (left) + action slot (right, e.g. IconButton)
//   • body   — standard padding (p-5), overridable via bodyClassName
//   • footer — optional, separated by a top border
//
// Phase 8: the card is a <motion.div>. On desktop hover it lifts 2px and
// gains a deeper drop shadow; touch devices (no fine pointer) skip the
// lift and reduced-motion users get a static card.
// ---------------------------------------------------------------------

export interface PanelProps {
  title?: ReactNode;
  /** Optional trailing element in the header (button, badge, …). */
  action?: ReactNode;
  /** Optional footer content. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Header tag level (default h3). */
  as?: "h2" | "h3" | "h4";
}

/** `true` only on devices with a precise hover pointer (desktop mice). */
function useHoverCapable(): boolean {
  const [hoverable, setHoverable] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setHoverable(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return hoverable;
}

export function Panel({
  title,
  action,
  footer,
  children,
  className = "",
  bodyClassName = "",
  as: Heading = "h3",
}: PanelProps) {
  const hoverCapable = useHoverCapable();
  const reduceMotion = useReducedMotion();
  const lift = hoverCapable && !reduceMotion;

  return (
    <motion.section
      className={`rounded-lg border border-subtle bg-secondary shadow-card ${className}`}
      whileHover={
        lift
          ? {
              y: -2,
              boxShadow: "0px 12px 32px -8px rgba(2, 6, 23, 0.55)",
            }
          : undefined
      }
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {(title !== undefined || action !== undefined) && (
        <header
          className={`flex items-center gap-3 border-b border-subtle px-5 py-4 ${
            title !== undefined ? "justify-between" : "justify-end"
          }`}
        >
          {title !== undefined && (
            <Heading className="text-sm font-semibold tracking-wide text-foreground">
              {title}
            </Heading>
          )}
          {action}
        </header>
      )}

      <div className={`p-5 ${bodyClassName}`}>{children}</div>

      {footer !== undefined && (
        <footer className="border-t border-subtle px-5 py-3">{footer}</footer>
      )}
    </motion.section>
  );
}

export default Panel;
