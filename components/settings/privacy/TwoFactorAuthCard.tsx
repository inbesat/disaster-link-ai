"use client";

// ---------------------------------------------------------------------
// components/settings/privacy/TwoFactorAuthCard.tsx — Privacy (Phase 6 · Step 3).
//
// Two-Factor Authentication setup flow:
//   • Status badge (grey "Disabled" → green "Enabled").
//   • "Enable 2FA" expands a setup area: mock QR code, mock setup key, and
//     a 6-digit OTP input.
//   • "Download Recovery Codes" fakes a .txt download and flips the badge.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";

const MOCK_SETUP_KEY = "JBSWY3DPEHPK3PXP";

export default function TwoFactorAuthCard() {
  const [setupOpen, setSetupOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"scan" | "verify">("scan");

  function downloadRecoveryCodes() {
    // Fake download for the demo — no real file touches disk.
    const codes = Array.from({ length: 10 }, () =>
      Array.from({ length: 4 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(
          Math.floor(Math.random() * 30),
        ),
      ).join(" "),
    );
    const body = [
      "DRIP — 2FA Recovery Codes",
      "Store these somewhere safe. Each code is single-use.",
      "",
      ...codes,
      "",
      "Generated: " + new Date().toISOString(),
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drip-2fa-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success("Recovery codes downloaded — keep them secure.");
    setEnabled(true);
    setSetupOpen(false);
    setStage("scan");
    setOtp("");
  }

  return (
    <section
      data-settings-key="privacy-two-factor"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <KeyRound className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="eoc-label text-emerald-300/80">SECURITY</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Two-Factor Authentication (2FA)
          </h2>
        </div>
        <StatusBadge enabled={enabled} />
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Add a second proof of identity beyond your password. Use any
        authenticator app (Google Authenticator, Authy, 1Password).
      </p>

      {/* Disabled empty state */}
      {!enabled && !setupOpen && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-panel-border bg-surface-muted/40 p-4">
          <p className="text-xs text-slate-500">
            Your account is protected by password only. Enable 2FA to block
            unauthorised access to command data.
          </p>
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/20"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Enable 2FA
          </button>
        </div>
      )}

      {/* Setup area */}
      {setupOpen && !enabled && (
        <div className="mt-5 rounded-md border border-emerald-400/40 bg-emerald-500/[0.06] p-5">
          <p className="text-sm font-bold text-slate-200">Set up your authenticator</p>
          {stage === "scan" ? (
            <>
              <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr]">
                {/* Mock QR code */}
                <div className="flex flex-col items-center gap-2">
                  <MockQr seed={MOCK_SETUP_KEY} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Scan with authenticator
                  </p>
                </div>

                {/* Setup key */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Manual setup key
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-panel-border bg-[#0a0f1d] px-3 py-2.5">
                    <code className="font-mono text-sm font-bold tracking-widest text-emerald-200">
                      {MOCK_SETUP_KEY}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(MOCK_SETUP_KEY);
                        toast("Setup key copied to clipboard.");
                      }}
                      className="rounded-md border border-panel-border px-2 py-1 text-[10px] font-bold text-slate-400 transition hover:border-emerald-400/50 hover:text-emerald-200"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    Enter this key into your app, or scan the QR code. Then
                    enter the current 6-digit code below to finish.
                  </p>
                </div>
              </div>

              {/* OTP input */}
              <div className="mt-5">
                <label
                  htmlFor="otp-code"
                  className="text-xs font-semibold text-slate-300"
                >
                  Current 6-digit code
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    id="otp-code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    placeholder="000 000"
                    className="w-40 rounded-md border border-panel-border bg-[#0a0f1d] px-3 py-2 text-center font-mono text-lg font-bold tracking-[0.4em] text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400/60"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (otp.length !== 6) {
                        toast.error("Enter the full 6-digit code.");
                        return;
                      }
                      toast.success("Code verified — confirm to enable.");
                      setStage("verify");
                    }}
                    className="rounded-md border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    Verify Code
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-md border border-emerald-400/30 bg-surface-muted/40 p-4">
              <p className="text-xs text-slate-300">
                Authenticator verified. Download your recovery codes before
                enabling — they are the only way back in if you lose access.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {stage === "verify" && (
              <button
                type="button"
                onClick={downloadRecoveryCodes}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/60 bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/25"
              >
                <Lock className="h-4 w-4" aria-hidden />
                Download Recovery Codes
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSetupOpen(false);
                setStage("scan");
                setOtp("");
              }}
              className="rounded-md border border-panel-border px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Enabled state */}
      {enabled && (
        <div className="mt-5 flex items-start gap-3 rounded-md border border-emerald-400/40 bg-emerald-500/[0.07] p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-200">
              2FA is active on your account
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Every login now asks for an authenticator code alongside your
              password. Recovery codes were saved as{" "}
              <code className="rounded bg-surface-muted px-1 font-mono text-[10px] text-emerald-300">
                drip-2fa-recovery-codes.txt
              </code>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
        enabled
          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-300"
          : "border-slate-500/40 bg-slate-600/10 text-slate-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          enabled ? "bg-emerald-400" : "bg-slate-500"
        }`}
        aria-hidden
      />
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

// Deterministic pseudo-QR using the setup key → stable squares per render.
function MockQr({ seed }: { seed: string }) {
  const size = 21; // 21×21 modules (QR min)
  const cells: boolean[] = [];
  let h = 7;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 1e6;

  for (let i = 0; i < size * size; i += 1) {
    const x = i % size;
    const y = Math.floor(i / size);
    // Finder patterns in 3 corners
    const inFinder =
      (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
    if (inFinder) {
      const fx = x < 7 ? x : x % 7;
      const fy = y < 7 ? y : y % 7;
      const ring = Math.max(Math.abs(fx - 3), Math.abs(fy - 3));
      cells[i] = ring <= 1;
    } else {
      h = (h * 31 + x * 17 + y * 13) % 1000;
      cells[i] = h > 450;
    }
  }

  return (
    <div
      className="rounded-md border border-panel-border bg-white p-2"
      style={{ width: 140 }}
      role="img"
      aria-label="Mock 2FA QR code for scanning"
    >
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {cells.map((filled, index) => (
          <span
            key={index}
            className={filled ? "bg-[#0a0f1d]" : "bg-white"}
            style={{ aspectRatio: "1 / 1" }}
          />
        ))}
      </div>
    </div>
  );
}