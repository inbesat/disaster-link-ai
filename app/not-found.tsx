import Link from "next/link";

/**
 * not-found.tsx — custom 404 page for SafeSphere.
 * Matches the design system: dark background, severity-blue accents.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-accent/10 border border-accent/20">
          <span className="text-4xl font-bold text-accent">404</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          Page Not Found
        </h1>

        <p className="text-sm text-slate-400">
          The page you are looking for does not exist or has been moved.
          If you believe this is an error, return to the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/80"
          >
            Go to Home
          </Link>
          <Link
            href="/command-center"
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-surface-muted"
          >
            Command Center
          </Link>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Emergency? Call <strong className="text-accent">112</strong> (India Emergency)
          or <strong className="text-accent">1070</strong> (Disaster Helpline)
        </p>
      </div>
    </div>
  );
}
