"use client";

import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------
// components/ui/IconButton.tsx — UI/UX Phase 1 · Step 5 (+ Phase 8 · Step 3).
//
// Icon-only button (no text). The accessible name is REQUIRED via the
// `label` prop (rendered as aria-label + title), so icon buttons are
// never invisible to screen readers.
//
// Variants: ghost (quiet), filled (accent-primary + blue glow),
//           danger (accent-danger + red glow), floating (elevated).
// Sizes:    sm 32px · md 40px · lg 48px (touch-friendly hit targets).
//
// Phase 8: the button is a <motion.button> — taps compress it to 95%
// on a stiff spring so presses have physical weight.
//
// Demo-day hardening · Step 9 (a11y fast pass): the accessible name is
// compile-enforced (required `label` prop), and the keyboard focus ring
// uses focus-visible: (ring shows on Tab, not on mouse clicks) with
// ring-accent-primary + a ring-offset matching --bg-primary. The offset
// is an arbitrary value because bg-primary is a hand-written class, not
// a Tailwind color (gotcha #2). role="button" / tabIndex={0} are
// intentionally NOT set — this is a native <button>, which already
// exposes both natively.
// ---------------------------------------------------------------------

const VARIANTS = {
  ghost:
    "border border-transparent text-slate-300 transition-colors hover:bg-[var(--bg-tertiary)] hover:text-foreground",
  filled:
    "bg-accent-primary text-white shadow-glow-blue transition hover:opacity-90 hover:shadow-none",
  danger:
    "bg-accent-danger text-white shadow-glow-red transition hover:opacity-90 hover:shadow-none",
  floating:
    "border border-border bg-surface-elevated text-foreground shadow-lg transition hover:border-accent hover:text-accent",
  purple:
    "bg-severity-purple-500 text-white shadow-[0_0_16px_rgba(168,85,247,0.35)] transition hover:opacity-90 hover:shadow-none",
} as const;

const SIZES = {
  sm: "h-8 w-8", // 32px
  md: "h-10 w-10", // 40px
  lg: "h-12 w-12", // 48px
} as const;

export type IconButtonVariant = keyof typeof VARIANTS;
export type IconButtonSize = keyof typeof SIZES;

export interface IconButtonProps extends ComponentPropsWithoutRef<typeof motion.button> {
  /** Accessible name — required (rendered as aria-label + title). */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  children: ReactNode;
}

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className = "",
  children,
  ...rest
}: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={rest.title ?? label}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${
        SIZES[size]
      } ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export default IconButton;
