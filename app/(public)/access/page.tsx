import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { enableGuestMode } from "@/app/actions/auth";

// ---------------------------------------------------------------------
// app/(public)/access/page.tsx — dual-mode entry door.
// Every visitor self-selects their path (Resident/Citizen → /login?mode=citizen,
// Responder/Official → /login?mode=gov). Continue as Guest calls enableGuestMode
// (sets guest_mode + role=public cookies and redirects to /public/dashboard).
// Reached from the marketing landing (/): header Sign In / footer links.
// ---------------------------------------------------------------------

const CITIZEN_FEATURES = [
  { icon: "📢", label: "Report ground truth" },
  { icon: "🚨", label: "Get life-safety alerts" },
  { icon: "🏕️", label: "Find nearby shelters" },
];

const RESPONDER_FEATURES = [
  { icon: "🖥️", label: "Command center access" },
  { icon: "🚁", label: "Triage & dispatch" },
  { icon: "🧭", label: "District oversight" },
];

export default function ChooseAccessPage() {
  return (
    <main className="landing-page relative flex min-h-screen flex-col overflow-hidden bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop — deep navy with blue/orange glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_-10%,rgba(37,99,235,0.28),transparent),radial-gradient(ellipse_55%_45%_at_5%_110%,rgba(249,115,22,0.16),transparent)]"
      />

      {/* Slim header */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--blue)] to-[var(--orange)] shadow-md">
            <ShieldCheck className="h-4.5 w-4.5 text-white" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-tight text-white">
            SafeSphere
          </span>
        </Link>
        <Link
          href="/trust"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--dl-text-on-navy)] transition hover:border-[var(--dl-blue)]/60 hover:text-white"
        >
          Trust &amp; Security
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-10 md:py-16">
        <p className="eoc-label mb-4 text-[var(--dl-blue-light)]">
          BHARAT SHAKTI HACKATHON · TRACK: AI FOR SOCIETY · PS3
        </p>
        <h1 className="text-balance max-w-2xl text-4xl font-bold leading-tight text-white md:text-5xl">
          Who are you? Choose your access path.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--dl-text-on-navy)] md:text-lg">
          Citizens report and stay safe. Responders command and coordinate. Pick the door
          that fits your role on the ground — every second counts.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* ------------------------------------------------------------
              CARD A — RESIDENT / CITIZEN (soft, welcoming, light)
              ------------------------------------------------------------ */}
          <div className="flex flex-col gap-4">
            <Link
              href="/login?mode=citizen"
              className="group relative flex min-h-[340px] flex-1 flex-col justify-between overflow-hidden rounded-[var(--dl-radius)] border border-[var(--dl-blue)]/20 bg-gradient-to-br from-[var(--dl-gray)] via-white to-[#E3EEFF] p-8 text-[var(--dl-text-dark)] shadow-[var(--dl-shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--dl-shadow-glow-orange)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] md:min-h-[400px] md:p-10"
            >
              {/* soft corner glow */}
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--dl-orange-light)]/40 blur-3xl transition-opacity duration-300 group-hover:opacity-100 md:opacity-60"
              />
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--dl-orange-light)]/50 text-5xl shadow-sm md:h-24 md:w-24 md:text-6xl"
                >
                  🏠
                </span>
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-[var(--dl-text-dark)] md:text-3xl">
                  I am a Resident / Citizen
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--dl-text-muted)] md:text-base">
                  Stay informed when it matters. Report what you see, get life-safety
                  alerts, and find the nearest shelter — all in your language.
                </p>
              </div>

              <div className="relative mt-8">
                <ul className="space-y-2.5">
                  {CITIZEN_FEATURES.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-center gap-2.5 text-sm font-medium text-[var(--dl-text-dark)]"
                    >
                      <span aria-hidden="true">{feature.icon}</span>
                      {feature.label}
                    </li>
                  ))}
                </ul>
                <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--dl-orange)] px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 group-hover:gap-3 group-hover:bg-[#EA5B0C]">
                  Enter the Public Portal
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* Continue as Guest — ghost button below Card A */}
            <form action={enableGuestMode}>
              <button
                type="submit"
                className="w-full rounded-[var(--dl-radius-sm)] border border-dashed border-[var(--dl-blue)]/40 bg-transparent px-4 py-3 text-sm font-medium text-[var(--dl-blue-light)] transition hover:border-[var(--dl-blue)] hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-blue)]"
              >
                Continue as Guest — browse only
              </button>
            </form>
          </div>

          {/* ------------------------------------------------------------
              CARD B — RESPONDER / OFFICIAL (dark, authoritative, navy)
              ------------------------------------------------------------ */}
          <Link
            href="/login?mode=gov"
            className="group relative flex min-h-[340px] h-full flex-col justify-between overflow-hidden rounded-[var(--dl-radius)] border border-white/10 bg-gradient-to-br from-[var(--dl-navy-3)] via-[var(--dl-navy-2)] to-[var(--dl-navy)] p-8 text-white shadow-[var(--dl-shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--dl-blue)]/50 hover:shadow-[var(--dl-shadow-glow-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-blue)] md:min-h-[400px] md:p-10"
          >
            <div
              aria-hidden="true"
              className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[var(--dl-blue)]/20 blur-3xl"
            />
            <div className="relative">
              <span
                aria-hidden="true"
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--dl-blue)]/25 text-5xl ring-1 ring-[var(--dl-blue)]/40 md:h-24 md:w-24 md:text-6xl"
              >
                🛡️
              </span>
              <h2 className="mt-6 text-2xl font-bold tracking-tight text-white md:text-3xl">
                I am a Responder / Official
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--dl-text-on-navy)] md:text-base">
                Command the response. Triage incoming reports, dispatch teams, run
                evacuations and keep your district ahead of the disaster.
              </p>
            </div>

            <div className="relative mt-8">
              <ul className="space-y-2.5">
                {RESPONDER_FEATURES.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-center gap-2.5 text-sm font-medium text-white"
                  >
                    <span aria-hidden="true">{feature.icon}</span>
                    {feature.label}
                  </li>
                ))}
              </ul>
              <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--dl-blue)] px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 group-hover:gap-3 group-hover:bg-[var(--dl-blue-light)]">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Enter the Gov Portal
              </span>
            </div>
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-[var(--dl-text-muted)]">
          Official access is granted after identity verification &amp; approval.
          Emergency? Call the District Control Room{" "}
          <a
            href="tel:1070"
            className="font-semibold text-[var(--dl-orange-light)] hover:underline"
          >
            1070
          </a>
        </p>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-5">
        <p className="text-center text-xs text-[var(--dl-text-muted)]">
          Multi-hazard command center · Flood · Earthquake · Cyclone · Wildfire
        </p>
      </footer>
    </main>
  );
}