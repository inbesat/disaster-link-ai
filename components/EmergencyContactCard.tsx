export default function EmergencyContactCard() {
  // Hidden below md: on phones this 228px-wide card used to cover the right
  // side of the fixed BottomNav (incl. the Alerts/More tabs — the handoff's
  // long-documented "overlay over the nav gutter" issue). Phones reach the
  // emergency line via the BottomNav's SOS EmergencyFAB instead; tablet+ has
  // no bottom nav, so the card is safe there (audit-pass fix Aug 9).
  return (
    <a
      href="tel:1070"
      aria-label="Call District Control Room 1070"
      className="fixed bottom-4 right-4 z-50 hidden items-center gap-3 rounded-lg bg-severity-red-600 px-4 py-3 font-semibold text-white shadow-glow-red transition hover:bg-severity-red-500 md:flex"
    >
      <SosIcon />
      <span>
        <span className="block text-[11px] uppercase tracking-wider text-red-100">
          District Control Room
        </span>
        <span className="block text-lg leading-none">1070</span>
      </span>
    </a>
  );
}

function SosIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 animate-pulse-ring text-white"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
