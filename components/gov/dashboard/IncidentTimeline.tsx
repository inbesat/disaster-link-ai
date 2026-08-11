"use client";

// ---------------------------------------------------------------------
// components/gov/dashboard/IncidentTimeline.tsx — Phase 7 · Step 8.
//
// Chronological log of the disaster response: a sleek, vertically
// scrolling timeline of the command team's actions. Rendered as a tab
// overlay inside AlertFeedWidget (Alerts | Timeline). Each event carries
// a tone-coded node on a continuous spine; the newest entry sits at the
// bottom with a live "now" pulse.
// ---------------------------------------------------------------------

type TimelineEvent = {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: "red" | "amber" | "green" | "purple" | "blue";
};

const EVENTS: TimelineEvent[] = [
  {
    id: "e1",
    time: "08:00",
    title: "Prediction Issued",
    detail: "72-h river forecast crosses danger mark — Ganga, Patna.",
    tone: "blue",
  },
  {
    id: "e2",
    time: "08:15",
    title: "AI Plan Approved by Cmdr Singh",
    detail: "Sector 4 evacuation plan reviewed and approved.",
    tone: "purple",
  },
  {
    id: "e3",
    time: "08:30",
    title: "NDRF Deployed",
    detail: "2 teams + 4 boats staged at NH-01 staging point.",
    tone: "amber",
  },
  {
    id: "e4",
    time: "08:42",
    title: "Alert Broadcast",
    detail: "Ganga danger advisory sent to 12,480 residents.",
    tone: "red",
  },
  {
    id: "e5",
    time: "08:55",
    title: "Crowd Report Verified",
    detail: "Sector 4 road block confirmed — added to live map.",
    tone: "green",
  },
  {
    id: "e6",
    time: "09:08",
    title: "Shelter Updated",
    detail: "Kankarbagh HS at 94% occupancy — flagged critical.",
    tone: "red",
  },
];

const NODE_STYLES: Record<TimelineEvent["tone"], string> = {
  red: "border-severity-red-400 bg-severity-red-400",
  amber: "border-severity-amber-400 bg-severity-amber-400",
  green: "border-severity-green-400 bg-severity-green-400",
  purple: "border-severity-purple-400 bg-severity-purple-400",
  blue: "border-[var(--dl-blue-light)] bg-[var(--dl-blue-light)]",
};

export function IncidentTimeline() {
  return (
    <div className="relative flex h-full flex-col">
      {/* Spine */}
      <div
        aria-hidden
        className="absolute bottom-3 left-[11px] top-3 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"
      />

      {/* Scrolling log */}
      <ol className="flex-1 space-y-4 overflow-y-auto pl-1 pr-1">
        {EVENTS.map((event) => (
          <li key={event.id} className="relative flex gap-3">
            {/* Node */}
            <span className="relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              <span
                className={`h-3.5 w-3.5 rounded-full border-2 border-black/60 ${NODE_STYLES[event.tone]}`}
              />
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] font-semibold tabular-nums text-white/70">
                  {event.time}
                </span>
                <span className="truncate text-[13px] font-semibold text-white/90">
                  {event.title}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--dl-text-muted)]">
                {event.detail}
              </p>
            </div>
          </li>
        ))}

        {/* Live marker — newest entry */}
        <li className="relative flex gap-3">
          <span className="relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-severity-green-400 opacity-50" />
              <span className="relative h-3 w-3 rounded-full border-2 border-black/60 bg-severity-green-400" />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="font-mono text-[11px] font-semibold tabular-nums text-white/70">
                now
              </span>
              <span className="text-[13px] font-semibold text-severity-green-300">System Online</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--dl-text-muted)]">
              All command feeds live · awaiting next event
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}

export default IncidentTimeline;
