"use client";

// ---------------------------------------------------------------------
// components/dashboard/ResponderStatusBoard.tsx — UI/UX Phase 4 · Step 7.
//
// "Active Field Units" board — dense flex-wrap grid of mock responder
// avatars with StatusDot presence indicators (online = pulsing green,
// busy = amber) plus a trailing "+12 offline" muted count.
// ---------------------------------------------------------------------

import Panel from "@/components/ui/Panel";
import StatusDot, { type PresenceStatus } from "@/components/ui/StatusDot";
import { initialsFor } from "@/lib/settings/avatar";

type MockUnit = {
  name: string;
  role: string;
  status: PresenceStatus;
};

const MOCK_UNITS: MockUnit[] = [
  { name: "R. Sinha", role: "Team Alpha", status: "online" },
  { name: "A. Mehta", role: "Boat-2", status: "online" },
  { name: "D. Patel", role: "Medical", status: "busy" },
  { name: "V. Kumar", role: "Team Alpha", status: "online" },
  { name: "M. Sheikh", role: "Crane-1", status: "busy" },
  { name: "I. Hussain", role: "Boat-1", status: "online" },
  { name: "K. Nair", role: "Triage", status: "online" },
  { name: "P. Das", role: "Civic", status: "busy" },
];

export function ResponderStatusBoard() {
  return (
    <Panel
      className=""
      title="Active Field Units"
      action={
        <span
          className="flex h-6 items-center justify-center rounded-full bg-accent-success/15 px-2 text-[11px] font-bold tabular-nums text-accent-success"
          title={`${MOCK_UNITS.length} units reachable on comms`}
        >
          {MOCK_UNITS.length} on comms
        </span>
      }
    >
      <ul className="flex flex-wrap gap-x-3 gap-y-4" aria-label="Active field responders">
        {MOCK_UNITS.map((unit) => (
          <li
            key={unit.name}
            className="flex flex-col items-center gap-1"
            title={`${unit.name} · ${unit.role}`}
          >
            <span className="relative">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-elevated text-xs font-semibold text-slate-100">
                {initialsFor(unit.name)}
              </span>
              {/* Presence dot anchored to the avatar's bottom-right edge */}
              <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-secondary">
                <StatusDot status={unit.status} name={unit.name} />
              </span>
            </span>
            <span className="max-w-14 truncate text-eoc-tiny text-muted">{unit.name}</span>
          </li>
        ))}

        {/* Offline tail — remainder of the unit roster */}
        <li
          className="flex h-11 flex-col items-center justify-center gap-1 px-1"
          title="12 units have no open comms channel"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-border text-eoc-tiny font-semibold tabular-nums text-muted">
            +12
          </span>
          <span className="text-eoc-tiny text-muted">offline</span>
        </li>
      </ul>
    </Panel>
  );
}

export default ResponderStatusBoard;
