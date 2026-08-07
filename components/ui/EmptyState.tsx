import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  /** Icon to show in the muted center circle. Defaults to a generic inbox. */
  icon?: LucideIcon;
  /** Short, bold call-to-action label — e.g. "No alerts on record". */
  title: string;
  /** One or two sentences explaining what belongs here / how to fix it. */
  description?: string;
  /** Optional action (e.g. a "+ Add First Resource" button). */
  actionButton?: ReactNode;
  /** Extra classes (e.g. rounding/padding overrides for table cells). */
  className?: string;
};

/**
 * Phase 22 · Step 3 — polished empty-state placeholder.
 *
 * Used by tables and feeds when their data array is empty or fully filtered
 * out (Alert History, Resource Inventory, …). Dashed border + muted centered
 * icon read as "slot waiting for data" rather than a broken render.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionButton,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-eoc border border-dashed border-border-strong/70 bg-surface-muted/30 px-6 py-12 text-center ${className}`}
    >
      {/* Muted icon in a soft ring */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-elevated/70">
        <Icon className="h-6 w-6 text-slate-500" aria-hidden />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
          {title}
        </h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">
            {description}
          </p>
        )}
      </div>

      {actionButton}
    </div>
  );
}

export default EmptyState;
