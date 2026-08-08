"use client";

// ---------------------------------------------------------------------
// components/settings/integrations/RateLimitCard.tsx — Integrations (Phase 8 · Step 8).
//
// API Quotas & Rate Limiting (financial safety controls):
//   • Mock monthly-usage progress bars — Twilio SMS (850/1000, amber) and
//     OpenRouter AI (120k/500k tokens, green) — with Indian-number-format
//     figures and a red tick marking the 95% auto-disable threshold.
//   • "Bill Shock Protection" toggle: when enabled, non-critical services
//     auto-pause once 95% of quota is consumed.
//
// Both the auto-disable flag and the per-service usage figures live in the
// shared useIntegrationSettings store (Step 10); the card only carries
// static display metadata (icons, hints, bar colors).
// ---------------------------------------------------------------------

import { MessageSquare, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { useIntegrationSettings } from "@/lib/integrations-settings-mock";

const AUTO_DISABLE_THRESHOLD = 95;

type Quota = {
  id: string;
  label: string;
  hint: string;
  /** Fallback figures — live values come from the shared store. */
  used: number;
  limit: number;
  unit: string;
  icon: typeof MessageSquare;
  barClass: string;
  badgeClass: string;
};

const QUOTAS: Quota[] = [
  {
    id: "twilio",
    label: "Twilio SMS",
    hint: "Outbound alert messages to responders",
    used: 850,
    limit: 1000,
    unit: "messages",
    icon: MessageSquare,
    barClass: "bg-amber-400",
    badgeClass: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  },
  {
    id: "openrouter",
    label: "OpenRouter AI",
    hint: "LLM tokens for planning + alert translation",
    used: 120_000,
    limit: 500_000,
    unit: "tokens",
    icon: Sparkles,
    barClass: "bg-emerald-400",
    badgeClass: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  },
];

/** Indian numbering (1,20,000) — matches the Bharat Shakti context. */
function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export default function RateLimitCard() {
  const { settings, setAutoDisable } = useIntegrationSettings();
  const autoDisable = settings.quotas.autoDisable;
  const usageById = new Map(settings.quotas.usage.map((u) => [u.id, u]));

  return (
    <section
      data-settings-key="integrations-rate-limit"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <ShieldAlert className="h-5 w-5 text-amber-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eoc-label text-amber-300/80">FINANCIAL SAFETY · COST GUARDRAILS</p>
          <h2 className="mt-0.5 text-lg font-bold">
            API Quotas &amp; Rate Limiting
          </h2>
        </div>
        <span className="rounded-full border border-[#2c3f6d] bg-surface-muted/40 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-slate-400">
          Resets 1st of month
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Track this month&apos;s paid API consumption so demo-day usage never
        turns into a surprise invoice.
      </p>

      {/* Monthly usage bars */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {QUOTAS.map((quota) => {
          // Live figures from the persisted store (fallback to defaults).
          const usage = usageById.get(quota.id);
          const used = usage?.used ?? quota.used;
          const limit = usage?.limit ?? quota.limit;
          const percent = Math.min(100, Math.round((used / limit) * 100));
          const QuotaIcon = quota.icon;
          return (
            <div
              key={quota.id}
              className="rounded-md border border-[#1c2740] bg-surface-muted/40 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
                  <QuotaIcon className="h-4 w-4 text-slate-300" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-100">
                    {quota.label}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {quota.hint}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums ${quota.badgeClass}`}
                >
                  {percent}%
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <p className="font-mono text-sm font-bold tabular-nums text-slate-200">
                  {formatCount(used)}{" "}
                  <span className="text-[11px] font-medium text-slate-500">
                    / {formatCount(limit)} {quota.unit}
                  </span>
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  this month
                </p>
              </div>

              {/* Progress track with a 95% auto-disable marker */}
              <div
                className="relative mt-1.5 h-2 rounded-full bg-[#122033]"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${quota.label} quota: ${percent}% of ${limit} ${quota.unit} used`}
              >
                <div
                  className={`h-full rounded-full ${quota.barClass}`}
                  style={{ width: `${percent}%` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-[3px] bottom-[-3px] left-[95%] w-px bg-red-400/80"
                  title={`Auto-disable threshold (${AUTO_DISABLE_THRESHOLD}%)`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bill Shock Protection toggle */}
      <div
        className={`mt-4 flex flex-wrap items-center justify-between gap-4 rounded-md border p-4 transition-colors ${
          autoDisable
            ? "border-amber-400/40 bg-amber-500/[0.06]"
            : "border-[#1c2740] bg-[#0a0f1d]"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              autoDisable ? "bg-amber-500/10" : "bg-slate-500/10"
            }`}
          >
            <Wallet
              className={`h-5 w-5 ${
                autoDisable ? "text-amber-300" : "text-slate-400"
              }`}
              aria-hidden
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-100">
              Bill Shock Protection
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              Auto-disable service when {AUTO_DISABLE_THRESHOLD}% quota is
              reached to prevent bill shock.
            </p>
            {autoDisable && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-300/90">
                <ShieldAlert className="h-3 w-3 shrink-0" aria-hidden />
                Non-critical services pause automatically at 95%; critical
                alerts still break through.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={autoDisable}
          aria-label="Auto-disable service at 95% quota"
          onClick={() => setAutoDisable(!autoDisable)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
            autoDisable ? "bg-amber-500" : "bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              autoDisable ? "translate-x-[26px]" : "-translate-x-[2px]"
            }`}
          />
        </button>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Demo fixtures — usage figures are simulated and reset on the 1st of
        each month.
      </p>
    </section>
  );
}
