import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowRight,
  Bell,
  HeartHandshake,
  MapPin,
  Siren,
} from "lucide-react";
import GuestModeBanner from "@/components/GuestModeBanner";
import AITeaser from "@/components/public/AITeaser";
import BottomNav from "@/components/public/BottomNav";
import EmergencyDial from "@/components/public/EmergencyDial";
import FamilyStrip from "@/components/public/FamilyStrip";
import NearbySheltersList from "@/components/public/NearbySheltersList";
import PullToRefresh from "@/components/public/PullToRefresh";
import SafetyOverview from "@/components/public/SafetyOverview";

// ---------------------------------------------------------------------
// app/public/dashboard/page.tsx — Phase 2 · Step 1 · Mobile-first
// "My Safety Status" dashboard shell (Steps 1–10 landed).
//
// Strictly single-column and mobile-first: the whole surface rides in a
// max-w-md column (the phone frame) on every viewport, with the sticky
// citizen BottomNav (Home/Alerts/Map/SOS) pinned to its base. The column
// content is wrapped in PullToRefresh (Step 10) — drag down from the top
// past 80px to re-run the mock status refresh (1.5s spinner + haptic +
// "Last updated" stamp). Stack: SafetyOverview (Steps 2–5: geo-fence
// status hero, contextual action, 3-day forecast) → FamilyStrip (Step 6)
// → NearbySheltersList (Step 7) → EmergencyDial (Step 8, tel: speed-dial
// — replaces the old standalone Call-1070 strip) → module grid → AITeaser
// (Step 9, pills deep-link to /public/ai?q=…). Guest banner (Step 9 of
// Phase 1) persists while guest_mode=true; bottom padding clears the
// fixed 72px nav + safe area so no content hides behind it.
// ---------------------------------------------------------------------

const MODULES = [
  {
    icon: Siren,
    title: "SOS Report",
    description: "Report flooding, fire, or ground truth from your phone.",
    href: "/public/report",
    accent: "text-red-300",
    ring: "group-hover:ring-red-400/40",
  },
  {
    icon: Bell,
    title: "Live Alerts",
    description: "Targeted warnings for your district, in your language.",
    href: "/public/alerts",
    accent: "text-orange-300",
    ring: "group-hover:ring-orange-400/40",
  },
  {
    icon: MapPin,
    title: "Nearby Shelters",
    description: "Find the closest open shelter and a safe route to it.",
    href: "/public/shelters",
    accent: "text-blue-300",
    ring: "group-hover:ring-blue-400/40",
  },
  {
    icon: HeartHandshake,
    title: "Family Circle",
    description: "One-tap SOS blasts to the contacts you added in setup.",
    href: "/public/family",
    accent: "text-emerald-300",
    ring: "group-hover:ring-emerald-400/40",
  },
];

export default function PublicDashboardPage() {
  const phone = cookies().get("citizen_phone")?.value ?? "";
  const isGuest = cookies().get("guest_mode")?.value === "true";

  return (
    <main className="relative flex min-h-screen flex-col bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_-10%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(249,115,22,0.14),transparent)]"
      />

      {/* Guest mode banner (persistent while guest_mode=true) */}
      <GuestModeBanner />

      {/* Phone-frame column — single column at every breakpoint */}
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-5">
        {/* Pull-to-refresh wraps the entire dashboard content (Step 10) */}
        <PullToRefresh>
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 animate-pulse-ring rounded-full bg-severity-red-500" />
            <span className="text-sm font-bold tracking-tight text-white">
              Citizen Portal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="eoc-label hidden text-[var(--dl-text-muted)] sm:block">
              {isGuest
                ? "GUEST MODE"
                : phone
                  ? `+91 ${phone.slice(-4).padStart(4, "•")}`
                  : "NOT SIGNED IN"}
            </span>
            <Link
              href="/"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:border-[var(--dl-blue)]/60 hover:text-white"
            >
              Home
            </Link>
          </div>
        </header>

        {/* Safety stack — live status (mock geo-fence) → hero card →
            contextual action → 3-day forecast (Phase 2 · Steps 2–5) */}
        <section className="mt-8">
          <SafetyOverview />
        </section>

        {/* Family safety strip — avatars with status dots, tap to nudge
            (Phase 2 · Step 6) */}
        <section className="mt-8">
          <FamilyStrip />
        </section>

        {/* Nearby shelters quick-list — exactly 3, with walk time &
            occupancy (Phase 2 · Step 7) */}
        <section className="mt-8">
          <NearbySheltersList />
        </section>

        {/* Emergency speed-dial — 4 tel: squares, red control room
            (Phase 2 · Step 8; replaces the old Call-1070 strip) */}
        <section className="mt-8">
          <EmergencyDial />
        </section>

        {/* Module grid */}
        <section className="mt-8 flex-1">
          <div className="space-y-3">
            {MODULES.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="group relative flex items-center gap-4 overflow-hidden rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4 ring-1 ring-transparent backdrop-blur transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-blue)]"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 transition group-hover:ring-2 ${module.ring}`}
                >
                  <module.icon aria-hidden="true" className={`h-5 w-5 ${module.accent}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center gap-1.5 text-base font-bold text-white">
                    {module.title}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 text-[var(--dl-text-muted)] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--dl-orange-light)]"
                    />
                  </h2>
                  <p className="mt-0.5 text-sm leading-relaxed text-[var(--dl-text-muted)]">
                    {module.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* AI Safety Assistant teaser — prompt pills deep-link to
            /public/ai?q=… (Phase 2 · Step 9) */}
        <section className="mt-8">
          <AITeaser />
        </section>
        </PullToRefresh>
      </div>

      {/* Sticky citizen bottom nav — Home (active) · Alerts · Map · SOS */}
      <BottomNav />
    </main>
  );
}
