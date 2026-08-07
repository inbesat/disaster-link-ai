import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Database,
  EyeOff,
  Fingerprint,
  FileCheck,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Trust & Security Center | Disaster Response Intelligence",
  description:
    "How the Disaster Response Intelligence Platform protects citizen data — encryption, anonymized crowdsourcing, and strict district-level access control.",
};

const SECTIONS = [
  {
    icon: Lock,
    kicker: "ENCRYPTION",
    title: "End-to-End Encryption",
    accent: "text-accent",
    ring: "bg-accent/10",
    copy: (
      <>
        Every byte of emergency data is protected <strong>in transit and at
        rest</strong>. All communication between field responders, the command
        center, and the platform travels over <strong>TLS 1.2+ encrypted
        channels</strong>, and stored records are encrypted at rest with
        <strong>AES-256</strong> by the managed database. Browser alerts are
        delivered through <strong>VAPID-signed Web Push encryption</strong> —
        so a critical flood alert can only be decrypted by the responder it was
        sent to.
      </>
    ),
    bullets: [
      "TLS 1.2+ for every API call and page load",
      "AES-256 encryption at rest for all records",
      "VAPID-encrypted Web Push delivery",
      "Server-only secrets — audited automatically before every release",
    ],
  },
  {
    icon: EyeOff,
    kicker: "PRIVACY",
    title: "Anonymized Crowdsourcing",
    accent: "text-severity-green-400",
    ring: "bg-severity-green-500/10",
    copy: (
      <>
        Citizens can report ground truth <strong>without surrendering their
        identity</strong>. Report text is sanitized and PII — phone numbers,
        email addresses — is <strong>auto-redacted at ingest</strong>. Only
        anonymized GPS coordinates and a report category are stored. Trending
        topics are computed on redacted text, so private details can never
        surface on a public dashboard.
      </>
    ),
    bullets: [
      "Phone numbers & emails stripped at ingestion",
      "GPS-only location — no names, no profiles",
      "Spam heuristics + responder verification triage",
      "🔒 PII Auto-Redacted for Privacy on every citizen report",
    ],
  },
  {
    icon: UserCheck,
    kicker: "ACCESS CONTROL",
    title: "Strict Role-Based Access Control",
    accent: "text-severity-amber-400",
    ring: "bg-severity-amber-500/10",
    copy: (
      <>
        Access is enforced <strong>in depth</strong> — at the edge, the API,
        the AI, and the database. Four <strong>Zod-validated roles</strong>
        govern what each responder can see, and
        <strong>district-level isolation</strong> guarantees a Patna commander
        can never see Kerala&apos;s data. The AI planning tools refuse
        unauthorized district queries, and every admin action is audited.
      </>
    ),
    bullets: [
      "super_admin → district_admin → field_responder → viewer",
      "Row-Level Security scoped by district at the database",
      "AI tool-call guards: “Error: Unauthorized. You may only query data for…”",
      "Full audit trail of who did what, and when",
    ],
  },
];

const COMPLIANCE = [
  { icon: FileCheck, label: "GDPR Art. 20 & DPDP Act 2023" },
  { icon: Fingerprint, label: "OWASP-aligned input sanitization" },
  { icon: Database, label: "PostGIS + Row-Level Security" },
  { icon: KeyRound, label: "Zero secrets in the client bundle" },
];

export default function TrustPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 animate-pulse-ring rounded-full bg-severity-green-500" />
            <span className="font-bold tracking-tight text-foreground">
              Disaster Response Intelligence
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-300 transition hover:text-accent"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-14 pt-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-surface-elevated shadow-[0_0_60px_-10px] shadow-accent/30">
          <ShieldCheck aria-hidden="true" className="h-10 w-10 text-accent" />
        </div>
        <p className="eoc-label mb-3 text-accent">TRUST &amp; SECURITY CENTER</p>
        <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-foreground md:text-5xl">
          Built for the moments when
          <br />
          <span className="text-accent">trust is everything.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
          Disaster response runs on sensitive data — citizen locations, shelter
          occupancy, resource stockpiles. We protect it with the same discipline
          a government control room expects: encryption, anonymization, and
          strict access control at every layer.
        </p>
      </section>

      {/* Feature sections */}
      <section className="mx-auto max-w-4xl space-y-6 px-6 pb-16">
        {SECTIONS.map(({ icon: Icon, kicker, title, copy, bullets, accent, ring }) => (
          <article
            key={title}
            className="eoc-panel grid gap-6 p-7 md:grid-cols-[auto_1fr] md:p-8"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl ${ring} self-start`}
            >
              <Icon aria-hidden="true" className={`h-7 w-7 ${accent}`} />
            </div>
            <div>
              <p className={`eoc-label mb-1 ${accent}`}>{kicker}</p>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">
                {title}
              </h2>
              <p className="mt-3 leading-relaxed text-slate-300">{copy}</p>
              <ul className="mt-4 grid gap-2 md:grid-cols-2">
                {bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-sm text-slate-400"
                  >
                    <span className="mt-1 text-accent">▪</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      {/* Compliance strip */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-2xl border border-border bg-surface-muted p-6">
          <p className="eoc-label mb-4 text-center text-accent">
            CERTIFICATIONS &amp; COMPLIANCE POSTURE
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {COMPLIANCE.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-slate-300"
              >
                <Icon aria-hidden="true" className="h-4 w-4 text-accent" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 text-xs text-slate-500">
          <span>Disaster Response Intelligence Platform · Bharat Shakti Hackathon</span>
          <span>
            Emergency contact: District Control Room{" "}
            <a href="tel:1070" className="font-semibold text-severity-red-400">
              1070
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
