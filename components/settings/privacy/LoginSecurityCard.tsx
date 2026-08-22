"use client";

// ---------------------------------------------------------------------
// components/settings/privacy/LoginSecurityCard.tsx — Privacy (Phase 6 · Step 4).
//
// Session & login security policies:
//   • Idle Session Timeout dropdown (15m · 30m · 1h · 4h · Never).
//   • "Require password change every 90 days" toggle.
//   • "Block login from unknown IP addresses pending email verification"
//     toggle — ON by default for a secure footprint.
//
// Controlled component: reads/writes the shared privacy-settings store
// through props, so the policy survives refresh and stays consistent with
// the other Phase 6 cards.
// ---------------------------------------------------------------------

import type { ReactNode } from "react";
import toast from "react-hot-toast";
import { Globe, KeyRound, LogOut } from "lucide-react";
import {
  SESSION_TIMEOUTS,
  type LoginSecurityPolicy,
  type SessionTimeout,
} from "@/lib/settings/privacy-settings";

export default function LoginSecurityCard({
  policy,
  onChange,
}: {
  policy: LoginSecurityPolicy;
  onChange: (next: LoginSecurityPolicy) => void;
}) {
  const { sessionTimeout, requirePasswordChange90d, blockUnknownIp } = policy;

  return (
    <section
      data-settings-key="privacy-login-security"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <LogOut className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-emerald-300/80">POLICIES</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Login &amp; Session Security
          </h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Automated session and sign-in guardrails applied to every command
        console in the demo.
      </p>

      <div className="mt-5 space-y-4">
        {/* Idle session timeout */}
        <div className="rounded-md border border-panel-border bg-surface-muted/40 p-4">
          <label
            htmlFor="idle-timeout"
            className="flex items-center gap-2 text-sm font-bold text-slate-200"
          >
            <LogOut className="h-4 w-4 text-emerald-300" aria-hidden />
            Idle Session Timeout
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Auto sign-out after this period of inactivity on the platform.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              id="idle-timeout"
              value={sessionTimeout}
              onChange={(e) => {
                const v = e.target.value as SessionTimeout;
                onChange({ ...policy, sessionTimeout: v });
                const meta = SESSION_TIMEOUTS.find((t) => t.value === v)!;
                toast(
                  `Idle session timeout set to ${meta.label}${
                    meta.note ? ` (${meta.note})` : ""
                  }.`,
                  { duration: 2500 },
                );
              }}
              className="rounded-md border border-panel-border bg-[#0a0f1a] px-3 py-2 text-sm font-semibold text-slate-200 outline-none focus:border-emerald-400/60"
            >
              {SESSION_TIMEOUTS.map((t) => (
                <option key={t.value} value={t.value} className="bg-[#0a0f1a]">
                  {t.label}
                  {t.note ? ` — ${t.note}` : ""}
                </option>
              ))}
            </select>

            {sessionTimeout === "never" && (
              <span className="rounded-full border border-red-400/50 bg-red-500/10 px-2 py-0.5 text-eoc-tiny font-bold uppercase tracking-wider text-red-300">
                Disables auto sign-out
              </span>
            )}
          </div>
        </div>

        {/* Password rotation toggle */}
        <ToggleRow
          icon={<KeyRound className="h-4 w-4 text-emerald-300" aria-hidden />}
          title="Require password change every 90 days"
          hint="Forces a fresh password at each 90-day anniversary."
          checked={requirePasswordChange90d}
          onChange={() => {
            onChange({
              ...policy,
              requirePasswordChange90d: !requirePasswordChange90d,
            });
            toast(
              `Periodic password reset ${
                !requirePasswordChange90d ? "enabled" : "disabled"
              }.`,
              { duration: 2500 },
            );
          }}
        />

        {/* Unknown-IP login block */}
        <ToggleRow
          icon={<Globe className="h-4 w-4 text-emerald-300" aria-hidden />}
          title="Block login from unknown IP addresses pending email verification"
          hint="New locations require an emailed verification link before access."
          checked={blockUnknownIp}
          onChange={() => {
            onChange({ ...policy, blockUnknownIp: !blockUnknownIp });
            toast(
              `Unknown-IP login block ${blockUnknownIp ? "turned off" : "turned on"}.`,
              { duration: 2500 },
            );
          }}
        />
      </div>
    </section>
  );
}

function ToggleRow({
  icon,
  title,
  hint,
  checked,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-panel-border bg-surface-muted/40 p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
          {icon}
        </span>
        <div>
          <p className="text-sm font-bold text-slate-200">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        </div>
      </div>
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={onChange}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange();
          }
        }}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
    </div>
  );
}
