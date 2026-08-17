import Link from "next/link";
import { Apple, Globe, Smartphone, ArrowLeft, Download } from "lucide-react";

export const metadata = {
  title: "Download SafeSphere",
  description:
    "Get the SafeSphere app for Android, iOS & iPadOS, or use the Progressive Web App — the official disaster response platform for field responders and citizens.",
};

const PLATFORMS = [
  {
    icon: Smartphone,
    title: "Android",
    subtitle: "Requires Android 8.0+",
    action: (
      <a
        href="/safesphere.apk"
        download="safesphere.apk"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 active:scale-[0.99]"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        ⬇ Download .apk
      </a>
    ),
    badge: "Recommended",
    badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  },
  {
    icon: Apple,
    title: "iOS & iPadOS",
    subtitle: "App Store & TestFlight",
    action: (
      <button
        type="button"
        disabled
        className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-800/60 px-4 py-3 text-sm font-semibold text-slate-500 opacity-70"
      >
        Coming Soon
      </button>
    ),
    badge: null,
    badgeClass: "",
  },
  {
    icon: Globe,
    title: "Progressive Web App",
    subtitle: "No installation required.",
    action: (
      <Link
        href="/"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 active:scale-[0.99]"
      >
        Open Web App
      </Link>
    ),
    badge: "Fastest",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },
];

export default function DownloadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1a] px-4 py-16 text-white">
      {/* Header */}
      <header className="mx-auto w-full max-w-2xl text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">
          Download SafeSphere
        </h1>
        <p className="mt-4 text-base text-slate-400 sm:text-lg">
          The official disaster response platform for field responders and
          citizens.
        </p>
      </header>

      {/* Platform cards */}
      <div className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          return (
            <section
              key={platform.title}
              className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-colors duration-200 hover:border-slate-600"
            >
              {platform.badge ? (
                <span
                  className={`self-start rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${platform.badgeClass}`}
                >
                  {platform.badge}
                </span>
              ) : (
                <span className="self-start rounded-full border border-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Not yet
                </span>
              )}

              <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800/80">
                <Icon className="h-6 w-6 text-slate-200" aria-hidden="true" />
              </div>

              <h2 className="mt-4 text-lg font-bold">{platform.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{platform.subtitle}</p>

              <div className="mt-6 flex-1" />
              {platform.action}
            </section>
          );
        })}
      </div>

      <footer className="mt-12 text-center text-xs text-slate-500">
        SafeSphere builds signed releases for every supported platform. Verify
        the checksum before sideloading an APK.
      </footer>
    </main>
  );
}