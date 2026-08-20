"use client";

// ---------------------------------------------------------------------
// components/settings/contacts/ControlRoomCard.tsx — Contacts (Phase 7 · Step 3).
//
// Official District Control Room — the always-on command numbers behind
// every alert:
//   • Solid amber top border marks this as the authoritative channel.
//   • Primary (1070), Alternate (0612-2217305) and the official email
//     are displayed as large mono figures.
//   • Each row carries big, high-contrast "One-Tap Call" (tel:) and
//     "Email" (mailto:) links so they open the device's native apps.
// ---------------------------------------------------------------------

import { Landmark, Mail, Phone } from "lucide-react";

const CONTROL_LINES: {
  key: string;
  label: string;
  number: string;
  tel: string;
  note: string;
}[] = [
  {
    key: "primary",
    label: "PRIMARY",
    number: "1070",
    tel: "tel:1070",
    note: "National emergency helpline",
  },
  {
    key: "alternate",
    label: "ALTERNATE",
    number: "0612-2217305",
    tel: "tel:+916122217305",
    note: "District control room line",
  },
];

const OFFICIAL_EMAIL = "controlroom@district.gov.in";
const EMAIL_HREF = `mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent(
  "Emergency Contact — District Control Room",
)}`;

export default function ControlRoomCard() {
  return (
    <section
      data-settings-key="contacts-control-room"
      className="rounded-eoc border border-panel-border border-t-4 border-t-amber-400 bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Landmark className="h-5 w-5 text-amber-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-amber-300/90">OFFICIAL COMMAND · DISTRICT PATNA</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Official District Control Room
          </h2>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Staffed 24×7
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Verified numbers used in every alert broadcast. One-tap actions open
        your device&apos;s native dialer and email apps.
      </p>

      {/* Contact lines */}
      <div className="mt-5 space-y-3">
        {CONTROL_LINES.map((line) => (
          <div
            key={line.key}
            className="flex flex-wrap items-center gap-4 rounded-md border border-panel-border bg-surface-muted/40 p-4"
          >
            <div className="min-w-0">
              <p className="eoc-label text-amber-300/80">{line.label}</p>
              <p className="mt-0.5 font-mono text-2xl font-bold tracking-wide text-slate-50">
                {line.number}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{line.note}</p>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2.5">
              {/* Native dialer link */}
              <a
                href={line.tel}
                aria-label={`One-tap call ${line.number}`}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-5 py-3 text-sm font-bold text-emerald-950 shadow-[0_0_18px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 active:scale-[0.98]"
              >
                <Phone className="h-4 w-4" aria-hidden />
                One-Tap Call
              </a>
              {/* Native email link */}
              <a
                href={EMAIL_HREF}
                aria-label={`Email the control room about ${line.number}`}
                className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-5 py-3 text-sm font-bold text-sky-950 shadow-[0_0_18px_rgba(14,165,233,0.3)] transition hover:bg-sky-400 active:scale-[0.98]"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Email
              </a>
            </div>
          </div>
        ))}

        {/* Email row */}
        <div className="flex flex-wrap items-center gap-4 rounded-md border border-panel-border bg-surface-muted/40 p-4">
          <div className="min-w-0">
            <p className="eoc-label text-cyan-300/80">EMAIL</p>
            <p className="mt-0.5 font-mono text-lg font-bold tracking-wide text-slate-50">
              {OFFICIAL_EMAIL}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Written updates, reports and escalation requests
            </p>
          </div>

          <a
            href={EMAIL_HREF}
            aria-label="Email the district control room"
            className="ml-auto inline-flex items-center gap-2 rounded-md bg-sky-500 px-5 py-3 text-sm font-bold text-sky-950 shadow-[0_0_18px_rgba(14,165,233,0.3)] transition hover:bg-sky-400 active:scale-[0.98]"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Email
          </a>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Numbers shown are demo fixtures for the Patna hero scenario — swap in
        your district&apos;s verified control-room lines before go-live.
      </p>
    </section>
  );
}
