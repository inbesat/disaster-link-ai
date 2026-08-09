"use client";

// ---------------------------------------------------------------------
// components/ui/ContextActionBar.tsx — UI/UX Phase 9 · Step 3.
//
// Thumb-zone optimization for one-handed field responders. Detail-only
// screens (an active alert, an AI plan, a shelter) mount this bar so the
// single most important action sits in the "thumb slide zone" — a fixed
// floating container pinned just above the Phase 3 BottomNav (72px tall +
// safe area), so the responder never stretches to reach it.
//
// Conventions:
//   • Primary, high-contrast actions (Approve Plan, Send Alert, Mark Safe)
//     live in the bottom container where a resting thumb lands.
//   • Secondary actions (Edit, Cancel, Archive) belong in the TOP header —
//     rendered here as a slim top rail (below the app header) only when
//     `secondaryActions` is provided. Pages with their own sticky header
//     may omit them and rely on their existing header instead.
//   • The whole bar is mobile-focused (matches BottomNav's lg:hidden); on
//     desktop it docks at the very bottom since the nav bar is hidden there.
//   • Route-gated by the consumer via `visible` — the page decides whether
//     it's showing (e.g. only while viewing an alert / plan detail).
//
// Usage:
//   <ContextActionBar
//     context="Alert #104 — Ganga Floodplain"
//     primaryActions={[{ key:"approve", label:"Approve Plan", icon: Check, onClick }]}
//     secondaryActions={[{ key:"edit", label:"Edit", icon: Pencil, ... }]}
//     visible={Boolean(activeAlert)}
//   />
// -------------------------------------------------------------------------

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";

/** Visual variant for an action. `primary`/`danger`/`success` are the
    high-contrast bottom-zone choices; `ghost` suits a quieter top rail. */
export type ContextActionVariant = "primary" | "danger" | "success" | "ghost";

type ContextAction = {
  /** Stable React key. */
  key: string;
  /** Button label. */
  label: string;
  /** Icon rendered left of the label. */
  icon?: LucideIcon;
  /** Fired on tap. */
  onClick?: () => void;
  /** Defaults to "primary" in the bottom zone, "ghost" in the top rail. */
  variant?: ContextActionVariant;
  /** Disables the button. */
  disabled?: boolean;
  /** Shows a spinner and disables the button (in-flight action). */
  loading?: boolean;
  /** Accessible label when the text is hidden/truncated. */
  ariaLabel?: string;
};

type ContextActionBarProps = {
  /** Short context line shown inside the bar (e.g. "Alert #114 — Patna"). */
  context?: string;
  /** Primary, high-contrast actions — the thumb zone. Required. */
  primaryActions: ContextAction[];
  /** Secondary actions rendered into the slim top rail (Edit/Cancel/…). */
  secondaryActions?: ContextAction[];
  /** Route-gated visibility: the page sets this (e.g. while a detail is active). */
  visible?: boolean;
  /** Disable the whole bar (e.g. while a parent action is committing). */
  disabled?: boolean;
};

const spring = { type: "spring", stiffness: 400, damping: 34, mass: 0.8 } as const;
const none = { duration: 0 } as const;

/* ---------------------------------------------------------------------
   Button styling — high-contrast (bottom zone) vs quiet (top rail).
   🔥 Thumb zone: full-bleed flex-1 buttons so the primary action fills
   the navigable row; the ghost rail uses compact outline buttons.
   --------------------------------------------------------------------- */
function variantClasses(variant: ContextActionVariant): string {
  switch (variant) {
    case "primary":
      return "bg-[var(--accent-primary)] text-white shadow-[0_0_16px_rgba(59,130,246,0.35)] hover:bg-blue-500";
    case "danger":
      return "bg-[var(--accent-danger)] text-white shadow-[0_0_16px_rgba(239,68,68,0.35)] hover:bg-red-500";
    case "success":
      return "bg-[var(--accent-success)] text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.3)] hover:brightness-110";
    case "ghost":
      return "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white";
  }
}

function ActionButton({
  action,
  compact = false,
}: {
  action: ContextAction;
  /** Renders for the slim top rail (smaller height, icon+label). */
  compact?: boolean;
}) {
  const { label, icon: Icon, onClick, variant = "primary", disabled, loading } = action;

  const handleClick = onClick
    ? () => {
        triggerLightHaptic();
        onClick();
      }
    : undefined;

  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-label={action.ariaLabel ?? label}
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] active:scale-[0.985] ${
        disabled || loading ? "cursor-not-allowed opacity-45" : "cursor-pointer"
      } ${
        compact
          ? `h-9 px-3 ${variantClasses(variant)}`
          : `min-h-[48px] flex-1 px-4 py-2.5 ${variantClasses(variant)}`
      }`}
    >
      {Icon && !loading && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function ContextActionBar({
  context,
  primaryActions,
  secondaryActions = [],
  visible = true,
  disabled = false,
}: ContextActionBarProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? none : spring;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Secondary (quiet) actions — top rail under the app header.
              Only renders when provided; pages with their own header can
              simply leave `secondaryActions` empty. */}
          {secondaryActions.length > 0 && (
            <motion.header
              key="cab-top"
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={transition}
              className="pointer-events-none fixed inset-x-0 top-[56px] z-40 px-3 lg:hidden"
            >
              <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-end gap-2">
                {secondaryActions.map((action) => (
                  <ActionButton
                    key={action.key}
                    action={{ ...action, disabled: disabled || action.disabled }}
                    compact
                  />
                ))}
              </div>
            </motion.header>
          )}

          {/* Primary thumb-zone bar — pinned above the 72px BottomNav. */}
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 px-3 pb-2 lg:bottom-0 lg:px-px">
            <motion.div
              key="cab-bottom"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              transition={transition}
              className="pointer-events-auto mx-auto w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/95 shadow-2xl shadow-black/40 backdrop-blur-lg"
            >
              {context && (
                <p className="border-b border-white/10 px-4 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {context}
                </p>
              )}
              <div className={`flex items-stretch gap-2 p-2.5 ${context ? "pt-2" : ""}`}>
                {primaryActions.map((action) => (
                  <ActionButton
                    key={action.key}
                    action={{ ...action, disabled: disabled || action.disabled }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ContextActionBar;
