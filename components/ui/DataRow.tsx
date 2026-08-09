// ---------------------------------------------------------------------
// components/ui/DataRow.tsx
// UI/UX Phase 1 · Step 4 — horizontal list item for feeds & tables
// (shelter lists, resource lists, alert logs, responder directories).
// Demo-day hardening · Step 8 — data density & whitespace polish.
//
// Layout:  [icon tile]  title / subtitle  ...  trailingElement
// Typography: title = text-sm font-medium text-primary; subtitle =
// STRICTLY text-xs text-muted (mono readout). Hover tints the row with
// the roadmap --bg-tertiary; padding is tight-but-readable py-3 px-4.
// ---------------------------------------------------------------------

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type DataRowProps = {
  /** Lucide icon shown in the leading tile. */
  icon: LucideIcon;
  /** Primary row text. */
  title: string;
  /** Secondary line under the title (mono readout style). */
  subtitle?: string;
  /** Right-aligned content — a SeverityBadge, value, button, … */
  trailingElement?: ReactNode;
  /** Make the row clickable. */
  onClick?: () => void;
  className?: string;
};

/**
 * Horizontal list item. Hover tints the row with --bg-tertiary; add an
 * `onClick` to turn the whole row into a button.
 */
export function DataRow({
  icon: Icon,
  title,
  subtitle,
  trailingElement,
  onClick,
  className = "",
}: DataRowProps) {
  const interactive = typeof onClick === "function";

  // bg-tertiary is a hand-written roadmap class, so the hover tint uses an
  // arbitrary value (variants only apply to generated Tailwind utilities).
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`flex items-center gap-3 rounded-md py-3 px-4 transition-colors duration-150 hover:bg-[var(--bg-tertiary)] ${
        interactive
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          : ""
      } ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-tertiary text-secondary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-primary">{title}</span>
        {subtitle && (
          <span className="block truncate font-mono text-xs text-muted">{subtitle}</span>
        )}
      </span>

      {trailingElement != null && (
        <span className="ml-auto shrink-0">{trailingElement}</span>
      )}
    </div>
  );
}

export default DataRow;
