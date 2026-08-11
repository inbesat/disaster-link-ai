"use client";

import { Users } from "lucide-react";
import useGovPresence, {
  type PresenceStatus,
  type PresenceUser,
} from "@/hooks/useGovPresence";

// ---------------------------------------------------------------------
// components/gov/dashboard/PresenceBar.tsx — Phase 7 · Step 9 ·
// Real-Time Collaboration Shell.
//
// A compact stack of overlapping avatar circles showing who is currently
// viewing the Command Center (fed by the mock-WebSocket useGovPresence
// hook). Hovering an avatar reveals the person's name + role; a status
// dot + viewer count on the right show the channel state at a glance.
// Mounted inside the SituationHeader (Step 2).
// ---------------------------------------------------------------------

const MAX_STACK = 5;

/** Initials for the avatar — "DM Patna" → "DP". */
function initials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const STATUS_META: Record<
  PresenceStatus,
  { label: string; dot: string; pulse?: boolean }
> = {
  connecting: { label: "Connecting…", dot: "bg-severity-amber-400", pulse: true },
  online: { label: "Live", dot: "bg-severity-green-400", pulse: true },
  offline: { label: "Offline", dot: "bg-severity-red-400" },
};

function Avatar({ user }: { user: PresenceUser }) {
  return (
    <span
      title={`${user.name} — ${user.role}`}
      role="img"
      aria-label={`${user.name} — ${user.role}`}
      className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-[#0a0f1a] transition hover:z-10 hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, hsl(${user.hue} 65% 48%), hsl(${(user.hue + 24) % 360} 70% 62%))`,
      }}
    >
      {initials(user.name)}
      {/* Name tooltip */}
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#0d1526]/95 px-2 py-1 text-center opacity-0 shadow-lg backdrop-blur transition-opacity duration-150 group-hover:opacity-100">
        <span className="block text-[11px] font-semibold text-white">{user.name}</span>
        <span className="block text-[10px] text-[var(--dl-text-muted)]">{user.role}</span>
      </span>
    </span>
  );
}

export function PresenceBar() {
  const { users, status } = useGovPresence();
  const meta = STATUS_META[status];
  const stacked = users.slice(0, MAX_STACK);
  const overflow = users.length - stacked.length;

  return (
    <div className="flex items-center gap-2.5" aria-label="People viewing this dashboard">
      <div className="flex items-center -space-x-2">
        {stacked.map((user) => (
          <Avatar key={user.id} user={user} />
        ))}
        {overflow > 0 && (
          <span
            title={`${overflow} more viewers`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/80 ring-2 ring-[#0a0f1a]"
          >
            +{overflow}
          </span>
        )}
      </div>

      {/* Status dot + viewer count */}
      <div className="hidden flex-col items-start leading-none md:flex">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
          <span className="relative flex h-1.5 w-1.5" aria-hidden>
            {meta.pulse && (
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${meta.dot} opacity-60`} />
            )}
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          </span>
          {users.length} viewing
        </p>
        <p className="eoc-label mt-0.5 text-[10px] text-[var(--dl-text-muted)]">
          <Users aria-hidden="true" className="mr-1 inline h-3 w-3 align-[-2px]" />
          {meta.label}
        </p>
      </div>
    </div>
  );
}

export default PresenceBar;
