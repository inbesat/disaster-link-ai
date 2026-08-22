"use client";

// ---------------------------------------------------------------------
// components/ui/Button.tsx — UI/UX Phase 1 · Prompt 1.4
//
// Canonical button component with:
//   Variants: primary, secondary, ghost, danger
//   Sizes: sm, md, lg, xl
//   Support for left/right icon slots
//   Framer Motion tap animation
//   Focus-visible ring with offset
//   Composes IconButton for icon-only mode
// ---------------------------------------------------------------------

import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { motion } from "framer-motion";

const VARIANTS = {
  primary:
    "bg-accent-primary text-white shadow-glow-blue transition hover:opacity-90 hover:shadow-none",
  secondary:
    "border border-border bg-surface-elevated text-foreground transition hover:border-accent hover:text-accent",
  ghost:
    "border border-transparent text-slate-300 transition-colors hover:bg-[var(--bg-tertiary)] hover:text-foreground",
  danger:
    "bg-accent-danger text-white shadow-glow-red transition hover:opacity-90 hover:shadow-none",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-md",
  lg: "h-12 px-6 text-base gap-2.5 rounded-lg",
  xl: "h-14 px-8 text-lg gap-3 rounded-lg",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export interface ButtonProps extends ComponentPropsWithoutRef<typeof motion.button> {
  /** Button variant. */
  variant?: ButtonVariant;
  /** Button size. */
  size?: ButtonSize;
  /** Icon element to show before the label. */
  leftIcon?: ReactNode;
  /** Icon element to show after the label. */
  rightIcon?: ReactNode;
  /** Full-width button. */
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`inline-flex items-center justify-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:pointer-events-none disabled:opacity-50 ${
        SIZES[size]
      } ${VARIANTS[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </motion.button>
  );
}

export default Button;
