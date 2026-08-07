import Link from "next/link";
import DataHealthWidget from "@/components/dashboard/DataHealthWidget";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 animate-pulse-ring rounded-full bg-severity-red-500" />
            <span className="font-bold tracking-tight">
              Disaster Response Intelligence
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            <Link
              href="/directory"
              className="text-sm text-slate-300 transition hover:text-accent"
            >
              Directory
            </Link>
            <Link
              href="/trust"
              className="text-sm text-slate-300 transition hover:text-accent"
            >
              Trust &amp; Security
            </Link>
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-md border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/80"
            >
              Request Access
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
        <p className="eoc-label mb-4 text-accent">
          BHARAT SHAKTI HACKATHON · TRACK: AI FOR SOCIETY · PS3
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          AI-Powered Disaster Response
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
          Predict floods and hurricanes, map earthquake shaking and wildfire fronts, plan
          evacuations, allocate resources, and alert responders — before disaster strikes.
          Multi-hazard command center, anywhere in the world.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/80"
          >
            Join the Response Network
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border bg-surface-elevated px-6 py-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="eoc-panel flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="eoc-label text-accent">LIVE MAP PREVIEW</p>
            <p className="mt-2 text-sm text-slate-400">
              Global multi-hazard overlay — flood · earthquake · hurricane · wildfire ·
              tsunami
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          <DataHealthWidget />
          <div className="eoc-panel p-5">
            <p className="eoc-label mb-3 text-accent">SCHEDULED INGESTION</p>
            <p className="text-sm text-slate-300">
              Weather, river and hazard data are ingested on a schedule via Vercel Cron,
              with automatic synthetic fallback so the demo never goes dark.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-slate-500">
          Emergency contact: District Control Room{" "}
          <a href="tel:1070" className="font-semibold text-severity-red-400">
            1070
          </a>
        </p>
      </footer>
    </main>
  );
}
