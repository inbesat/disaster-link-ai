// ---------------------------------------------------------------------
// components/ui/Toast.tsx
// UI/UX Phase 1 · Step 7 — severity-based toast notifications.
//
// Wraps react-hot-toast (already used by ~70 components) instead of
// building a second toast stack:
//
//   <ToastViewport />  → mount once (replaces the plain <Toaster /> in
//                        app/layout.tsx). Restyles every existing
//                        toast.success() / toast.error() / toast("…")
//                        call site with the roadmap surface, and flips
//                        to top-center on mobile.
//   useToast()         → the new severity API (success / warning /
//                        error / info) rendering the full custom card:
//                        left --accent-* border, severity icon, dismiss
//                        button and a 5s shrinking progress bar.
//
// Styling: --bg-secondary / --border-subtle / --radius-lg /
// --shadow-card + per-severity --accent-* tokens — re-themes for dark
// and light "day ops" via the variables in globals.css.
// ---------------------------------------------------------------------

"use client";

import { useEffect, useState } from "react";
import { toast, Toaster, type Toast as ReactHotToast } from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";

export type ToastSeverity = "success" | "warning" | "error" | "info";

export type ToastOptions = {
  /** Primary message. */
  title: string;
  /** Optional secondary line under the title. */
  description?: ReactNode;
  /** Auto-dismiss delay in ms — defaults to 5000 (5s). */
  duration?: number;
  /** Replaces an existing toast with the same id (dedupe). */
  id?: string;
};

const SEVERITY_META: Record<
  ToastSeverity,
  { icon: LucideIcon; iconClass: string; accentVar: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-accent-success",
    accentVar: "var(--accent-success)",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-accent-warning",
    accentVar: "var(--accent-warning)",
  },
  error: {
    icon: XCircle,
    iconClass: "text-accent-danger",
    accentVar: "var(--accent-danger)",
  },
  info: {
    icon: Info,
    iconClass: "text-accent-primary",
    accentVar: "var(--accent-primary)",
  },
};

type ToastCardProps = {
  /** The react-hot-toast handle for this toast (drives dismissal). */
  t: ReactHotToast;
  severity: ToastSeverity;
  title: string;
  description?: ReactNode;
  /** Progress-bar duration in ms — the same value as the auto-dismiss. */
  duration: number;
};

/**
 * The custom toast card. react-hot-toast renders custom content raw (the
 * wrapper only positions it), so this card owns its whole box: roadmap
 * surface, left --accent-* strip, severity icon, optional description,
 * dismiss button and the shrinking progress bar (.toast-progress,
 * globals.css). `pointer-events-auto` re-enables clicks inside the
 * pointer-events:none toast layer. Hidden from screen readers only in the
 * decorative parts — the text itself is announced via role/aria-live.
 */
export function Toast({ t, severity, title, description, duration }: ToastCardProps) {
  const meta = SEVERITY_META[severity];
  const SeverityIcon = meta.icon;

  // t.visible flips false during the library's removeDelay — fade and
  // slide out so dismissal doesn't pop abruptly.
  return (
    <div
      role={severity === "error" ? "alert" : "status"}
      className="toast pointer-events-auto relative flex w-[320px] max-w-[calc(100vw-2rem)] items-start gap-2.5 overflow-hidden rounded-lg border border-subtle bg-secondary p-3 pl-4 shadow-card"
      style={{
        opacity: t.visible ? 1 : 0,
        transform: t.visible ? "translateX(0)" : "translateX(16px)",
        transition: "opacity 250ms ease-out, transform 250ms ease-out",
      }}
    >
      {/* Left accent strip — the severity color. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: meta.accentVar }}
      />

      <span className={`mt-0.5 shrink-0 ${meta.iconClass}`}>
        <SeverityIcon className="h-5 w-5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-primary">{title}</p>
        {description != null && (
          <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
        )}
      </div>

      <IconButton
        label="Dismiss notification"
        variant="ghost"
        size="sm"
        onClick={() => toast.dismiss(t.id)}
      >
        <X className="h-4 w-4" aria-hidden />
      </IconButton>

      {/* Auto-dismiss progress bar — shrinks over `duration`; the CSS pauses
          it on hover (visual only — the auto-dismiss timer keeps running). */}
      <span
        aria-hidden
        className="toast-progress absolute bottom-0 left-0 right-0 h-[3px]"
        style={{
          backgroundColor: meta.accentVar,
          animationDuration: `${duration}ms`,
        }}
      />
    </div>
  );
}

/**
 * Push a severity toast. Returns the toast id — pass it back via
 * `id` (replaces the toast) or to dismissToast(id).
 */
export function showToast(severity: ToastSeverity, options: ToastOptions): string {
  const { title, description, duration = 5000, id } = options;

  return toast.custom(
    (t) => (
      <Toast
        t={t}
        severity={severity}
        title={title}
        description={description}
        duration={duration}
      />
    ),
    { duration, id },
  );
}

/** Dismiss one toast (by id) — or all toasts when called with no id. */
export function dismissToast(id?: string): void {
  toast.dismiss(id);
}

/** Dismiss every visible toast. */
export function dismissAllToasts(): void {
  toast.dismiss();
}

/** Live matchMedia hook — repositions the Toaster responsively. */
function useIsMobile(breakpoint = "(max-width: 640px)"): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(breakpoint);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Mount once in the root layout (replaces the plain <Toaster />).
 * Desktop: bottom-right; mobile: top-center (per the roadmap spec).
 * The base toastOptions.style re-skins every existing toast() call site;
 * the new severity API (useToast) renders the full custom card above.
 */
export function ToastViewport() {
  const isMobile = useIsMobile();

  return (
    <Toaster
      position={isMobile ? "top-center" : "bottom-right"}
      gutter={8}
      containerClassName="toast-viewport"
      toastOptions={{
        duration: 5000,
        style: {
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-card)",
          fontSize: "0.875rem",
          padding: "0.75rem 1rem",
          maxWidth: "calc(100vw - 2rem)",
        },
        success: {
          icon: <CheckCircle2 className="h-5 w-5 text-accent-success" aria-hidden />,
        },
        error: {
          icon: <XCircle className="h-5 w-5 text-accent-danger" aria-hidden />,
        },
        loading: {
          icon: (
            <Loader2 className="h-5 w-5 animate-spin text-accent-primary" aria-hidden />
          ),
        },
      }}
    />
  );
}

export default ToastViewport;
