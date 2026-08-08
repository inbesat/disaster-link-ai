import { type ReactNode } from "react";

// ---------------------------------------------------------------------
// components/ui/Panel.tsx — UI/UX Phase 1 · Step 5
//
// Universal container: bg-secondary surface, radius-lg, shadow-card.
//   • header — optional title (left) + action slot (right, e.g. IconButton)
//   • body   — standard padding (p-5), overridable via bodyClassName
//   • footer — optional, separated by a top border
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

export function Panel({
  title,
  action,
  footer,
  children,
  className = "",
  bodyClassName = "",
  as: Heading = "h3",
}: PanelProps) {
  return (
    <section
      className={`rounded-lg border border-subtle bg-secondary shadow-card ${className}`}
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
    </section>
  );
}

export default Panel;
