import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

/**
 * Breadcrumbs — accessible, clickable breadcrumb trail.
 *
 * Usage:
 *   <Breadcrumbs items={["Settings", "Billing"]} />
 *   // renders: Home > Settings > Billing
 *
 * The first item always links to "/". Each subsequent item links to
 * the cumulative path segment (e.g., /settings, /settings/billing).
 * The last item is non-interactive (current page).
 */
interface BreadcrumbsProps {
  items: string[];
  className?: string;
  /** Base path prefix (default: "") — use when routes are nested under a group. */
  basePath?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function Breadcrumbs({
  items,
  className = "",
  basePath = "",
}: BreadcrumbsProps) {
  if (!items.length) return null;

  const segments = items.map((item, i) => {
    const path =
      basePath +
      "/" +
      items
        .slice(0, i + 1)
        .map(slugify)
        .join("/");
    return { label: item, path, isLast: i === items.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {/* Home */}
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {segments.map((seg) => (
          <li key={seg.path} className="flex items-center gap-1.5">
            <ChevronRight
              className="h-3.5 w-3.5 text-[var(--text-muted)]/50"
              aria-hidden
            />
            {seg.isLast ? (
              <span
                aria-current="page"
                className="font-medium text-[var(--text-primary)]"
              >
                {seg.label}
              </span>
            ) : (
              <Link
                href={seg.path}
                className="rounded-md px-1.5 py-0.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              >
                {seg.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
