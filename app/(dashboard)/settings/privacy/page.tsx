"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/privacy/page.tsx — UI/UX Phase 7 · Step 8.
//
// Privacy, security & GDPR surface:
//   • 2FA setup — mock QR block + authenticator code input
//   • mini paginated audit log (Timestamp / IP / Action)
//   • GDPR export — JSON/CSV file-type selector + "Download My Data"
//   • danger zone with a solid severity-critical border
// ---------------------------------------------------------------------

import { useState } from "react";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  QrCode,
  ShieldAlert,
  ShieldEllipsis,
  Trash2,
} from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { showToast } from "@/components/ui/Toast";

// --- Deterministic mock QR (21×21 with finder patterns) -----------------
const SEED = 20260809;
function seededState(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function qrModules(): boolean[][] {
  const rand = seededState(SEED);
  const grid = Array.from({ length: 21 }, () =>
    Array.from({ length: 21 }, () => rand() > 0.55),
  );
  const finder = (r: number, c: number) => {
    for (let i = -1; i <= 8; i++) {
      for (let j = -1; j <= 8; j++) {
        const rr = r + i;
        const cc = c + j;
        if (rr < 0 || rr >= 21 || cc < 0 || cc >= 21) continue;
        const ring = Math.max(Math.abs(i), Math.abs(j));
        const rim = i === 3 || i === 8 || j === 3 || j === 8;
        grid[rr][cc] = ring === 1 || ring === 4 || rim;
      }
    }
  };
  finder(0, 0);
  finder(0, 21 - 8);
  finder(21 - 8, 0);
  return grid;
}

type EventRow = {
  id: number;
  time: string;
  ip: string;
  action: string;
};

const EVENTS: EventRow[] = [
  { id: 1, time: "2026-08-09 09:12", ip: "203.0.113.9", action: "Successful login" },
  {
    id: 2,
    time: "2026-08-09 09:11",
    ip: "203.0.113.9",
    action: "Plan PNP-6-B1 approved",
  },
  { id: 3, time: "2026-08-09 08:58", ip: "198.51.100.42", action: "Resource dispatch" },
  { id: 4, time: "2026-08-09 08:42", ip: "212.83.10.7", action: "Blocked — failed 2FA" },
  {
    id: 5,
    time: "2026-08-09 07:55",
    ip: "203.0.113.9",
    action: "Threshold edited (Patna)",
  },
  {
    id: 6,
    time: "2026-08-09 07:30",
    ip: "198.51.100.42",
    action: "GeoJSON boundary uploaded",
  },
  { id: 7, time: "2026-08-09 06:15", ip: "203.0.113.9", action: "Audit log exported" },
  { id: 8, time: "2026-08-09 05:51", ip: "10.0.4.2", action: "Nightly backup" },
];

const PAGE_SIZE = 5;

export default function PrivacySecurityPage() {
  const [enrolled, setEnrolled] = useState(false);
  const [code, setCode] = useState("");
  const [page, setPage] = useState(0);
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [confirmText, setConfirmText] = useState("");
  const qr = qrModules();

  const totalPages = Math.ceil(EVENTS.length / PAGE_SIZE);
  const rows = EVENTS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      {/* 2FA */}
      <ScrollReveal>
        <SettingsSection
          title="Two-Factor Authentication"
          description="Enrol a TOTP authenticator to protect privileged commands."
          icon={ShieldEllipsis}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className="shrink-0 rounded-xl border border-border bg-white p-4">
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: "repeat(21, 8px)" }}
              >
                {qr.map((rowArr, r) =>
                  rowArr.map((filled, c) => (
                    <span
                      key={`${r}-${c}`}
                      className="h-2 w-2"
                      style={{ backgroundColor: filled ? "#0f172a" : "#ffffff" }}
                    />
                  )),
                )}
              </div>
              <p className="mt-2 flex items-center justify-center gap-1 font-mono text-[10px] text-slate-600">
                <QrCode className="h-3 w-3" aria-hidden /> drip:totf:aarav
              </p>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <p className="text-sm text-slate-200">
                {enrolled
                  ? "2FA is active on this account."
                  : "Scan with Google Authenticator, Authy or any TOTP app, then enter the 6-digit code."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-md border border-subtle bg-[var(--bg-tertiary)] px-3 py-2">
                  <ShieldEllipsis className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000 000"
                    aria-label="Authenticator code"
                    className="w-full bg-transparent font-mono text-sm tracking-[0.3em] text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (code.length !== 6) {
                      showToast("error", {
                        title: "Invalid code",
                        description: "Enter the 6-digit TOTP code.",
                      });
                      return;
                    }
                    setEnrolled(true);
                    showToast("success", {
                      title: "2FA enabled",
                      description: "Backup codes generated.",
                    });
                  }}
                  className="rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-accent/85"
                >
                  {enrolled ? "Reactivate" : "Verify &amp; enable"}
                </button>
              </div>
              <p className="font-mono text-[11px] text-muted">
                Secret: <span className="text-slate-400">JBSW Y3DP EHPK R3DHWZ DQMZ</span>
              </p>
            </div>
          </div>
        </SettingsSection>
      </ScrollReveal>

      {/* Audit Log */}
      <ScrollReveal delay={0.05}>
        <SettingsSection
          title="Audit Log"
          description="Recent security events on your account."
          icon={ShieldAlert}
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[520px] border-collapse text-xs">
              <thead className="bg-[var(--bg-tertiary)]">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
                  <th className="border-b border-subtle px-4 py-3 font-semibold">
                    Timestamp
                  </th>
                  <th className="border-b border-subtle px-4 py-3 font-semibold">
                    IP Address
                  </th>
                  <th className="border-b border-subtle px-4 py-3 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle bg-secondary">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--bg-tertiary)]/40">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-300">
                      {row.time}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                      {row.ip}
                    </td>
                    <td className="px-4 py-2.5 text-slate-200">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-accent hover:text-accent disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-accent hover:text-accent disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </SettingsSection>
      </ScrollReveal>

      {/* GDPR Export */}
      <ScrollReveal delay={0.1}>
        <SettingsSection
          title="GDPR Data Export"
          description="Download every record we hold about you — ownership of your data."
          icon={Download}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <fieldset className="flex flex-1 gap-2">
              <legend className="sr-only">Export format</legend>
              {(
                [
                  { value: "json", label: "JSON", icon: FileJson },
                  { value: "csv", label: "CSV", icon: FileSpreadsheet },
                ] as const
              ).map((opt) => {
                const active = format === opt.value;
                const Icon = opt.icon;
                return (
                  <label
                    key={opt.value}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border bg-secondary text-slate-300 hover:border-accent/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-format"
                      value={opt.value}
                      checked={active}
                      onChange={() => setFormat(opt.value)}
                      className="hidden"
                    />
                    <Icon className="h-4 w-4" aria-hidden />
                    {opt.label}
                  </label>
                );
              })}
            </fieldset>
            <button
              type="button"
              onClick={() =>
                showToast("success", {
                  title: "Download started",
                  description: `Your data archive (${format.toUpperCase()}) is being prepared.`,
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-accent/85"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download My Data
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted">
            Your archive is generated on demand and encrypted end-to-end.
          </p>
        </SettingsSection>
      </ScrollReveal>

      {/* Danger Zone */}
      <ScrollReveal delay={0.15}>
        <SettingsSection
          title="Danger Zone"
          description="Irreversible account actions."
          icon={Trash2}
        >
          <div className="rounded-xl border-2 border-severity-critical bg-severity-critical/5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-accent-danger">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Permanent account deletion
                </p>
                <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-400">
                  This action is{" "}
                  <span className="font-semibold text-accent-danger">irreversible</span>.
                  Every profile, session, plan and audit row is destroyed immediately.
                  Data is not recoverable, and regulatory retention windows are waived.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  aria-label="Type DELETE to confirm"
                  className="w-44 rounded-md border border-severity-critical bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-accent-danger"
                />
                <button
                  type="button"
                  disabled={confirmText !== "DELETE"}
                  onClick={() =>
                    showToast("error", {
                      title: "Account deleted",
                      description: "All data has been destroyed.",
                    })
                  }
                  className="rounded-md bg-accent-danger px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-danger/85 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </SettingsSection>
      </ScrollReveal>
    </div>
  );
}
