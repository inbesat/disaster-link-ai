"use client";

interface Collaborator {
  name: string;
  role: string;
  initials: string;
  color: string;
  ring: string;
}

const COLLABORATORS: Collaborator[] = [
  {
    name: "NDRF Cmdr Singh",
    role: "Ground Command",
    initials: "NS",
    color: "bg-red-500",
    ring: "#ef4444",
  },
  {
    name: "SDRF Unit 4",
    role: "Search & Rescue",
    initials: "S4",
    color: "bg-sky-500",
    ring: "#0ea5e9",
  },
  {
    name: "Dr. Meera Rao",
    role: "Health Liaison",
    initials: "MR",
    color: "bg-emerald-500",
    ring: "#10b981",
  },
  {
    name: "Control Room",
    role: "Operations",
    initials: "CR",
    color: "bg-amber-500",
    ring: "#f59e0b",
  },
];

export default function PresenceIndicators() {
  return (
    <div className="relative">
      <div className="flex items-center group">
        {COLLABORATORS.map((c, i) => (
          <div
            key={c.name}
            className="group/avatar relative"
            style={{ marginLeft: i === 0 ? 0 : "-12px" }}
          >
            <span
              title={c.name}
              className={`relative box-content flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-xs font-bold text-white ${c.color}`}
            >
              {c.initials}
              {/* glowing "viewing now" dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-background bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            </span>

            {/* Hover tooltip: name + active role */}
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs shadow-lg opacity-0 transition-opacity duration-150 group-hover/avatar:opacity-100"
            >
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${c.color}`} />
                <span className="font-semibold whitespace-nowrap text-foreground">
                  {c.name}
                </span>
              </span>
              <span className="block whitespace-nowrap text-[10px] uppercase tracking-wider text-accent">
                {c.role}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}