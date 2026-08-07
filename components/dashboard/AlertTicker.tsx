const ALERTS = [
  "🔴 FLASH FLOOD WARNING: Patna Sector 4 — evacuate immediately",
  "⚠️ BRIDGE COLLAPSE: NH-31 near Digha — route closed",
  "🚨 MASS SHELTER OVERFLOW: Riverside High School at 100% capacity",
  "🟠 COMMUNICATION OUTAGE: Danapur sector — satellite link required",
];

export default function AlertTicker() {
  return (
    <div className="relative overflow-hidden border-y border-severity-red-600/40 bg-severity-red-600/10">
      <div className="flex w-max animate-marquee items-center gap-10 py-2">
        {[0, 1].map((group) => (
          <div
            key={group}
            className="flex shrink-0 items-center gap-10 pr-10"
            aria-hidden={group === 1}
          >
            {ALERTS.map((alert, i) => (
              <span
                key={i}
                className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-severity-red-300"
              >
                {alert}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
