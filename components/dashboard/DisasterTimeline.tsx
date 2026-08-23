type TimelineEvent = {
  time: string;
  title: string;
  detail: string;
  type: "info" | "alert";
};

const EVENTS: TimelineEvent[] = [
  {
    time: "08:00",
    title: "AI Prediction Issued",
    detail: "Flood risk elevated to WARNING for Patna (Ganga).",
    type: "info",
  },
  {
    time: "09:15",
    title: "SMS Alert Broadcast",
    detail: "1,240 residents notified across Sector 4–7.",
    type: "alert",
  },
  {
    time: "10:30",
    title: "Evacuation Fleet Dispatched",
    detail: "6 boats + 3 buses en route to Ganga floodplain.",
    type: "info",
  },
  {
    time: "12:45",
    title: "Bridge Collapse Reported",
    detail: "NH-31 near Digha closed — route rerouted.",
    type: "alert",
  },
  {
    time: "14:10",
    title: "Shelter Overflow Warning",
    detail: "Riverside High School at 100% capacity.",
    type: "alert",
  },
];

const DOT_STYLES: Record<TimelineEvent["type"], string> = {
  info: "bg-sky-400 ring-sky-500/30",
  alert: "bg-severity-red-500 ring-severity-red-500/30",
};

export default function DisasterTimeline() {
  return (
    <div className="rounded-eoc border border-border bg-surface p-5">
      <p className="eoc-label text-accent">RESPONSE TIMELINE</p>
      <h2 className="mt-1 font-bold">Event History</h2>

      <ol className="relative mt-4 border-l-2 border-border pl-5">
        {EVENTS.map((event) => (
          <li key={event.time} className="relative pb-5 last:pb-0">
            <span
              className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ${DOT_STYLES[event.type]}`}
            />
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-accent">
                {event.time}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  event.type === "alert" ? "text-severity-red-400" : "text-sky-400"
                }`}
              >
                {event.type}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-foreground">{event.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              {event.detail}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
