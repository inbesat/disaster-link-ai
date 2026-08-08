import { type ButtonHTMLAttributes, type ReactNode } from "react";

// ---------------------------------------------------------------------
// components/ui/IconButton.tsx — UI/UX Phase 1 · Step 5
//
// Icon-only button (no text). The accessible name is REQUIRED via the
// `label` prop (rendered as aria-label + title), so icon buttons are
// never invisible to screen readers.
//
// Variants: ghost (quiet), filled (accent-primary + blue glow),
//           danger (accent-danger + red glow), floating (elevated).
// Sizes:    sm 32px · md 40px · lg 48px (touch-friendly hit targets).
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
} as const;

const SIZES = {
  sm: "h-8 w-8", // 32px
  md: "h-10 w-10", // 40px
  lg: "h-12 w-12", // 48px
} as const;

export type IconButtonVariant = keyof typeof VARIANTS;
export type IconButtonSize = keyof typeof SIZES;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
    <button
      type="button"
      aria-label={label}
      title={rest.title ?? label}
      className={`inline-flex shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-95 ${
        SIZES[size]
      } ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default IconButton;
