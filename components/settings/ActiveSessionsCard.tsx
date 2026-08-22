"use client";

// ---------------------------------------------------------------------
// components/settings/ActiveSessionsCard.tsx — Settings · Phase 6.
//
// Session tracking & device management card for /settings/profile:
//   • Account Status header — account creation date + last login (with IP).
//   • Active device/session list — "Current Session" (green Active Now dot)
//     plus secondary sessions with relative last-seen timestamps.
//   • Red-bordered destructive "Log Out All Other Devices" button that opens
//     a confirmation modal, and only clears the secondary sessions after the
//     user confirms (the current session is preserved).
//
// Sessions are mock data with no backend table yet — the "sign out others"
// just removes the secondary entries client-side and toasts the result.
// ---------------------------------------------------------------------

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Laptop,
  LogIn,
  LogOut,
  Monitor,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

type Session = {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastSeen: string;
  isCurrent: boolean;
};

const ACCOUNT_CREATED = "April 12, 2026";
const LAST_LOGIN = "Just now";
const LAST_LOGIN_IP = "192.168.1.1";

const INITIAL_SESSIONS: Session[] = [
  {
    id: "current",
    device: "Chrome on Windows 11",
    browser: "Chrome 130 · Desktop",
    location: "New Delhi, India",
    lastSeen: "Active now",
    isCurrent: true,
  },
  {
    id: "ios-safari",
    device: "Safari on iPhone 15 Pro",
    browser: "Safari 18 · iOS",
    location: "Patna, India",
    lastSeen: "2 hours ago",
    isCurrent: false,
  },
  {
    id: "edge-laptop",
    device: "Edge on Windows 11",
    browser: "Edge 131 · Desktop",
    location: "Patna, India",
    lastSeen: "Yesterday",
    isCurrent: false,
  },
];

function SessionIcon({ device }: { device: string }) {
  const lower = device.toLowerCase();
  if (lower.includes("iphone") || lower.includes("android") || lower.includes("mobile")) {
    return <Phone className="h-5 w-5 text-cyan-300" aria-hidden />;
  }
  if (lower.includes("ipad") || lower.includes("tablet")) {
    return <Monitor className="h-5 w-5 text-cyan-300" aria-hidden />;
  }
  return <Laptop className="h-5 w-5 text-cyan-300" aria-hidden />;
}

export default function ActiveSessionsCard() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const secondarySessions = sessions.filter((s) => !s.isCurrent);

  function handleConfirmSignOut() {
    setSigningOut(true);
    // Simulate the network call — other sessions get logged out; the current
    // session survives.
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setConfirmOpen(false);
      setSigningOut(false);
      toast.success("Logged out of all other devices.");
    }, 700);
  }

  return (
    <>
      <section
        data-settings-key="sessions"
        className="rounded-eoc border border-panel-border bg-surface p-6"
      >
        {/* Account Status summary header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-severity-green-500/10">
              <UserRound className="h-5 w-5 text-severity-green-400" aria-hidden />
            </div>
            <div>
              <p className="eoc-label text-severity-green-400/80">ACCOUNT STATUS</p>
              <h2 className="mt-0.5 text-lg font-bold">Active Sessions &amp; Devices</h2>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-severity-green-500/40 bg-severity-green-500/10 px-3 py-1.5 text-xs font-semibold text-severity-green-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-severity-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-severity-green-400" />
            </span>
            Account Secure
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-panel-border bg-surface-muted/40 p-4">
            <p className="eoc-label flex items-center gap-1.5 text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              ACCOUNT CREATED
            </p>
            <p className="mt-1.5 text-sm font-semibold">{ACCOUNT_CREATED}</p>
          </div>

          <div className="rounded-md border border-panel-border bg-surface-muted/40 p-4">
            <p className="eoc-label flex items-center gap-1.5 text-slate-400">
              <LogIn className="h-3.5 w-3.5" aria-hidden />
              LAST LOGIN
            </p>
            <p className="mt-1.5 text-sm font-semibold">
              {LAST_LOGIN} <span className="text-slate-500">from {LAST_LOGIN_IP}</span>
            </p>
          </div>
        </div>

        {/* Session list */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="eoc-label text-cyan-400/80">
              ACTIVE SESSIONS ({sessions.length})
            </p>
          </div>

          <ul className="mt-3 space-y-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className={`flex items-center gap-4 rounded-md border px-4 py-3.5 ${
                  session.isCurrent
                    ? "border-severity-green-500/40 bg-severity-green-500/5"
                    : "border-panel-border bg-surface-muted/40"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
                  <SessionIcon device={session.device} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{session.device}</p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-eoc-tiny font-bold uppercase tracking-wider ${
                        session.isCurrent
                          ? "border border-severity-green-500/40 bg-severity-green-500/10 text-severity-green-400"
                          : "border border-panel-borderHover bg-[#1c2740] text-slate-400"
                      }`}
                    >
                      {session.isCurrent ? (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-severity-green-500 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-severity-green-400" />
                          </span>
                          Active Now
                        </>
                      ) : (
                        "Secondary"
                      )}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {session.browser} · {session.location}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {session.lastSeen}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Destructive action */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-severity-red-600/40 bg-severity-red-600/5 p-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-severity-red-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-severity-red-400">
                {secondarySessions.length}{" "}
                {secondarySessions.length === 1 ? "other device" : "other devices"}{" "}
                are signed in to this account.
              </p>
              <p className="text-xs text-slate-400">
                Sign out everywhere to protect your responder account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={secondarySessions.length === 0}
            className="inline-flex items-center gap-2 rounded-md border-2 border-severity-red-600 bg-severity-red-600/10 px-4 py-2 text-sm font-bold text-severity-red-400 transition hover:bg-severity-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Log Out All Other Devices
          </button>
        </div>
      </section>

      {/* Destructive confirmation modal */}
      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-eoc border border-severity-red-600/50 bg-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-severity-red-600/10">
                <AlertTriangle className="h-5 w-5 text-severity-red-400" aria-hidden />
              </div>
              <div>
                <h2 id="signout-title" className="text-base font-bold text-severity-red-400">
                  Log out of {secondarySessions.length}{" "}
                  {secondarySessions.length === 1 ? "other device" : "other devices"}?
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  This signs you out of {secondarySessions.map((s) => s.device.split(" on ").pop()).join(" and ")}. You
                  stay signed in on this device. You can sign back in anytime.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={signingOut}
                className="rounded-md border border-panel-borderHover px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-surface-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 rounded-md bg-severity-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-severity-red-500 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {signingOut ? "Logging out…" : "Yes, log them out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}