"use client";

// ---------------------------------------------------------------------
// app/public/donations/page.tsx — Verified Relief Funds (citizen portal).
//
// Mobile-first donation hub: a grid of verified NGOs, each with a UPI
// QR code citizens can scan to donate directly. Every card carries a
// blue "Verified" badge — the District Control Room's stamp of approval,
// the anti-fraud guarantee the page's subtext promises. The Copy UPI ID
// button writes the NGO's UPI ID to the clipboard (with a fallback for
// non-secure demo hosts). Data is mock for the demo; the real version
// would read users where ngo_verification_status = 'verified'.
// ---------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  Check,
  Copy,
  HeartHandshake,
  Settings,
} from "lucide-react";
import PublicOfflineBanner from "@/components/public/PublicOfflineBanner";
import BottomNav from "@/components/public/BottomNav";

type VerifiedNgo = {
  name: string;
  description: string;
  upiId: string;
  qrUrl: string;
};

// Mock verified NGOs — only organizations approved by the District
// Control Room would appear here in production.
const VERIFIED_NGOS: VerifiedNgo[] = [
  {
    name: "SafeSphere Relief Fund",
    description:
      "Core relief fund powering flood rescues, shelter operations, and rapid-response kits across Bihar.",
    upiId: "safesphere@upi",
    qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=safesphere@upi",
  },
  {
    name: "Kerala Flood Rescue",
    description:
      "Community rescue collective — boats, medical camps, and rehabilitation for flood-hit districts in Kerala.",
    upiId: "keralarescue@okhdfc",
    qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=keralarescue@okhdfc",
  },
  {
    name: "Global Care NGO",
    description:
      "Multi-state humanitarian NGO distributing food, water, and hygiene kits to displaced families.",
    upiId: "globalcare@ybl",
    qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=globalcare@ybl",
  },
];

/** Copy text to the clipboard with a fallback for insecure contexts. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts (e.g. http:// demo hosts).
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

function NgoCard({ ngo }: { ngo: VerifiedNgo }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(ngo.upiId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <article className="flex flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.08]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold text-white">{ngo.name}</h2>
        {/* Blue verified checkmark — the District Control Room stamp. */}
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--dl-blue)]/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--dl-blue-light)]">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          Verified
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-[var(--dl-text-muted)]">
        {ngo.description}
      </p>

      {/* QR on white so any scanner reads it reliably */}
      <div className="mt-4 flex justify-center rounded-xl bg-white p-3 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.5)]">
        <Image
          src={ngo.qrUrl}
          alt={`Donation QR code for ${ngo.name}`}
          width={160}
          height={160}
          className="h-36 w-36 sm:h-40 sm:w-40"
        />
      </div>

      <button
        type="button"
        onClick={() => void handleCopy()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:border-[var(--dl-blue)]/60 hover:bg-[var(--dl-blue)]/10"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-400" aria-hidden />
            UPI ID Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" aria-hidden />
            Copy UPI ID
          </>
        )}
      </button>
      <p className="mt-2 text-center font-mono text-xs text-[var(--dl-text-muted)]">
        {ngo.upiId}
      </p>
    </article>
  );
}

export default function DonationsPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#0a0f1a]">
      <main className="relative flex w-full flex-1 flex-col bg-[var(--dl-navy)] pb-[100px] text-[var(--dl-text-on-navy)]">
        {/* Ambient backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_-10%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(16,185,129,0.12),transparent)]"
        />

        {/* Guest mode banner mounted in app/public/layout.tsx */}
        <PublicOfflineBanner />

        {/* Content column — full width on phones, max-w-7xl on desktop.
            Bottom padding clears the fixed 72px BottomNav on mobile. */}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-6 md:py-10">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 animate-pulse-ring rounded-full bg-severity-green-500" />
              <span className="text-sm font-bold tracking-tight text-white">
                Citizen Portal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/public/settings"
                aria-label="Settings"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[var(--dl-text-muted)] transition hover:border-[var(--dl-orange)]/60 hover:text-white"
              >
                <Settings aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:border-[var(--dl-blue)]/60 hover:text-white"
              >
                Home
              </Link>
            </div>
          </header>

          {/* Title + anti-fraud subtext */}
          <section className="mt-8">
            <h1 className="flex items-center gap-2.5 text-xl font-bold text-white sm:text-2xl">
              <HeartHandshake
                className="h-6 w-6 text-[var(--dl-orange)]"
                aria-hidden
              />
              Verified Relief Funds
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--dl-text-muted)]">
              Scan QR codes below to donate directly. All organizations listed
              here are verified by the District Control Room to prevent fraud.
            </p>
          </section>

          {/* Verified NGO grid — stacks on phones, 2-up tablet, 3-up desktop */}
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERIFIED_NGOS.map((ngo) => (
              <NgoCard key={ngo.upiId} ngo={ngo} />
            ))}
          </section>
        </div>

        {/* Citizen bottom nav — Home · Alerts · Map · Donate · Settings · SOS */}
        <BottomNav className="md:hidden !max-w-none" />
      </main>
    </div>
  );
}
