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
  KeyRound,
  Laptop,
  LogOut,
  QrCode,
  ShieldAlert,
  ShieldEllipsis,
  Smartphone,
  Trash2,
} from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { showToast } from "@/components/ui/Toast";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";

type ActiveSession = {
  id: string;
  ip: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

const MOCK_ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: "sess_1",
    ip: "203.0.113.9",
    device: "Chrome on macOS (Current)",
    location: "Patna, Bihar",
    lastActive: "Just now",
    isCurrent: true,
  },
  {
    id: "sess_2",
    ip: "198.51.100.42",
    device: "Capacitor Mobile (Android)",
    location: "Muzaffarpur, Bihar",
    lastActive: "12 min ago",
    isCurrent: false,
  },
  {
    id: "sess_3",
    ip: "10.0.4.2",
    device: "Firefox on Linux",
    location: "Sitamarhi, Bihar",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
];

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
  const [sessions, setSessions] = useState<ActiveSession[]>(MOCK_ACTIVE_SESSIONS);
  const [newPassword, setNewPassword] = useState("");
  const [isDemoUser] = useState(true); // Demo user safeguard flag
  const qr = qrModules();

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showToast("success", {
      title: "Session revoked",
      description: "The session has been terminated.",
    });
  };

  const handleRevokeAll = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast("success", {
      title: "All other sessions logged out",
      description: "Only your current device remains logged in.",
    });
  };

  const totalPages = Math.ceil(EVENTS.length / PAGE_SIZE);
  const rows = EVENTS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      {/* DEMO ACCOUNT WATERMARK / BANNER */}
      {isDemoUser && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 font-mono text-xs text-accent">
          ⚡ DEMO ACCOUNT ACTIVE — Password changes and account deletion are restricted for read-only stability.
        </div>
      )}

      {/* Password Change Section */}
      <ScrollReveal>
        <SettingsSection
          title="Change Password"
          description="Update your account password with strong complexity."
          icon={KeyRound}
        >
          <div className="flex max-w-md flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-300">New Password</label>
              <input
                type="password"
                disabled={isDemoUser}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-md border border-subtle bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent disabled:opacity-50"
              />
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <button
              type="button"
              disabled={isDemoUser || !newPassword}
              onClick={() => {
                showToast("success", {
                  title: "Password updated",
                  description: "Your password has been changed.",
                });
                setNewPassword("");
              }}
              className="mt-1 rounded-md bg-accent px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-accent/85 disabled:opacity-40"
            >
              Update Password
            </button>
          </div>
        </SettingsSection>
      </ScrollReveal>

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
              <p className="mt-2 flex items-center justify-center gap-1 font-mono text-eoc-tiny text-slate-600">
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

      {/* Active Sessions */}
      <ScrollReveal delay={0.03}>
        <SettingsSection
          title="Active Sessions"
          description="Manage active logins and revoke access across devices."
          icon={Laptop}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">
                Showing {sessions.length} active session{sessions.length === 1 ? "" : "s"}
              </p>
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeAll}
                  className="inline-flex items-center gap-1.5 rounded-md border border-severity-critical/40 bg-severity-critical/10 px-3 py-1.5 text-xs font-semibold text-accent-danger transition hover:bg-severity-critical/20"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Log Out All Devices
                </button>
              )}
            </div>

            <div className="divide-y divide-subtle rounded-lg border border-border bg-secondary">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-[var(--bg-tertiary)] p-2 text-slate-300">
                      {sess.device.includes("Mobile") ? (
                        <Smartphone className="h-4 w-4" aria-hidden />
                      ) : (
                        <Laptop className="h-4 w-4" aria-hidden />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {sess.device}
                        </span>
                        {sess.isCurrent && (
                          <span className="rounded bg-accent/20 px-1.5 py-0.5 text-eoc-tiny font-bold text-accent">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-muted">
                        {sess.ip} · {sess.location} · Last active {sess.lastActive}
                      </p>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.id)}
                      className="mt-2 self-start rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-accent-danger hover:text-accent-danger sm:mt-0 sm:self-center"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
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
                <tr className="text-left text-eoc-tiny uppercase tracking-wider text-muted">
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
