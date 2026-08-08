// ---------------------------------------------------------------------
// components/ui/StatusDot.tsx
// UI/UX Phase 1 · Step 3 — presence indicator for responders & services.
//
// An 8px circular dot with three states:
//   • online  — emerald (accent-success) + animated pulsing ping ring
//   • busy    — amber (accent-warning), static
//   • offline — slate gray, static
//
// The ping ring uses absolute positioning + Tailwind's animate-ping so it
// radiates outward without affecting layout. A title + aria-label make the
// state readable by screen readers (never color alone).
// ---------------------------------------------------------------------

export type PresenceStatus = "online" | "offline" | "busy";

const STATUS_META: Record<PresenceStatus, { dot: string; label: string }> = {
  online: { dot: "bg-accent-success", label: "Online" },
  busy: { dot: "bg-accent-warning", label: "Busy" },
  offline: { dot: "bg-slate-500", label: "Offline" },
};

type StatusDotProps = {
  /** Presence state — "online" gets the pulsing ring. */
  status: PresenceStatus;
  /** Optional human-readable name, e.g. a responder's name. */
  name?: string;
  className?: string;
};

/**
 * 8px presence dot. `online` renders an absolute-positioned `animate-ping`
 * ring behind the dot so the state reads as "live" without layout shift.
 */
export function StatusDot({ status, name, className = "" }: StatusDotProps) {
  const meta = STATUS_META[status] ?? STATUS_META.offline;
  const title = name ? `${name} · ${meta.label}` : meta.label;

  return (
    <span
      className={`relative inline-flex h-2 w-2 shrink-0 ${className}`}
      role="status"
      title={title}
      aria-label={title}
    >
      {/* Pulsing ping ring — only for the live state */}
      {status === "online" && (
        <span
          className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-accent-success opacity-60"
          aria-hidden
        />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${meta.dot}`} />
    </span>
  );
}

export default StatusDot;
