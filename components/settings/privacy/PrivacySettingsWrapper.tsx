"use client";

// ---------------------------------------------------------------------
// components/settings/privacy/PrivacySettingsWrapper.tsx — Privacy (Phase 6).
//
// Responsive privacy & security page shell (dark emergency-ops theme).
// Hosts every Phase 6 section, all driven by the shared
// usePrivacySettings() hook (Step 10):
//   • Data Visibility          (Step 2)  — self-contained via the hook
//   • Login & 2FA              (Steps 3-4)
//   • API Keys                 (Step 5)
//   • Audit Log                (Step 6)
//   • Data Export              (Step 7)
//   • Data Retention           (Step 8)
//   • Account Deactivation     (Step 9)
//
// The provider persists every change to localStorage ("drip_privacy_
// settings_v1") and fires a subtle success toast; deactivation flows pass
// { silent: true } because the Danger Zone wizard shows its own toasts.
// ---------------------------------------------------------------------

import {
  ShieldCheck,
  Database,
  KeyRound,
  Lock,
  ScrollText,
  Trash2,
  DatabaseZap,
} from "lucide-react";
import {
  PrivacySettingsProvider,
  usePrivacySettings,
} from "@/lib/privacy-settings-mock";
import DataVisibilityCard from "./DataVisibilityCard";
import TwoFactorAuthCard from "./TwoFactorAuthCard";
import LoginSecurityCard from "./LoginSecurityCard";
import ApiKeyManagementCard from "./ApiKeyManagementCard";
import AuditLogCard from "./AuditLogCard";
import DataExportCard from "./DataExportCard";
import DataRetentionCard from "./DataRetentionCard";
import AccountDeactivationCard from "./AccountDeactivationCard";

export default function PrivacySettingsWrapper() {
  return (
    <PrivacySettingsProvider>
      <PrivacyPageContent />
    </PrivacySettingsProvider>
  );
}

function PrivacyPageContent() {
  const { settings: store, update } = usePrivacySettings();

  return (
    <div className="space-y-10" data-settings-scope="privacy">
      {/* Page header */}
      <div>
        <p className="eoc-label flex items-center gap-2 text-emerald-300/90">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          SETTINGS / PRIVACY &amp; SECURITY
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Privacy, Security &amp; Data Management
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Control your operational footprint, secure your account, and manage
          data compliance.
        </p>
      </div>

      {/* Section grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 2 — Data Visibility */}
        <div className="lg:col-span-2">
          <SectionLabel icon={ShieldCheck} label="DATA VISIBILITY" />
          <DataVisibilityCard />
        </div>

        {/* Steps 3-4 — Login & 2FA */}
        <div className="lg:col-span-2">
          <SectionLabel icon={Lock} label="LOGIN & 2FA" />
          <div className="grid gap-6 lg:grid-cols-2">
            <TwoFactorAuthCard />
            <LoginSecurityCard
              policy={store.loginSecurity}
              // The card already toasts the exact change (timeout, password
              // reset, unknown-IP block) — keep the hook toast silent.
              onChange={(loginSecurity) =>
                update({ loginSecurity }, { silent: true })
              }
            />
          </div>
        </div>

        {/* Step 5 — API Keys */}
        <div className="lg:col-span-2">
          <SectionLabel icon={KeyRound} label="API KEYS" />
          <ApiKeyManagementCard
            apiKeys={store.apiKeys}
            // Revokes fire their own toast; creation reveals the secret in
            // a modal — no need for the generic central toast too.
            onChange={(apiKeys) => update({ apiKeys }, { silent: true })}
          />
        </div>

        {/* Step 6 — Audit Log */}
        <div className="lg:col-span-2">
          <SectionLabel icon={ScrollText} label="AUDIT LOG" />
          <AuditLogCard />
        </div>

        {/* Steps 7-8 — Export & Retention */}
        <div className="lg:col-span-2">
          <SectionLabel icon={DatabaseZap} label="EXPORT & RETENTION" />
          <div className="grid gap-6 lg:grid-cols-2">
            <DataExportCard />
            <DataRetentionCard
              retention={store.retention}
              onChange={(retention) => update({ retention })}
            />
          </div>
        </div>

        {/* Step 9 — Account Actions */}
        <div className="lg:col-span-2">
          <SectionLabel icon={Trash2} label="ACCOUNT ACTIONS" />
          <AccountDeactivationCard
            mode={store.deactivation.mode}
            effectiveAt={store.deactivation.effectiveAt}
            onRequest={(mode) =>
              update(
                {
                  deactivation: {
                    mode,
                    effectiveAt: new Date().toISOString(),
                  },
                },
                { silent: true },
              )
            }
            onCancel={() =>
              update(
                { deactivation: { mode: null, effectiveAt: null } },
                { silent: true },
              )
            }
          />
        </div>
      </div>

      {/* Small footer note */}
      <p className="flex items-center gap-2 text-xs text-slate-600">
        <Database className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Privacy preferences are stored locally per device and sync to your
        responder profile.
      </p>
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <p className="eoc-label mb-3 flex items-center gap-2 text-emerald-400/80">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </p>
  );
}
