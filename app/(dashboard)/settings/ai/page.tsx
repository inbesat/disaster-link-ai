"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/ai/page.tsx — UI/UX Phase 7 · Step 6.
//
// LLM configuration:
//   • provider pickup — 3 radio cards (OpenAI / Claude / Local), the
//     active card gets an accent-purple border
//   • response verbosity — custom slider with 3 snap points; above it
//     three speech bubbles scaling small (concise) → large (detailed)
//   • tool access — permissions matrix (sticky-header table) of which
//     databases the AI may read
// ---------------------------------------------------------------------

import { useState } from "react";
import { Bot, Database, MessageSquareText, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import Toggle from "@/components/settings/Toggle";
import type {
  AiProvider,
  AiToolKey,
  ResponseVerbosity,
} from "@/lib/settings/ai-settings";

type Provider = {
  value: AiProvider;
  brand: string;
  model: string;
  description: string;
};

const PROVIDERS: Provider[] = [
  {
    value: "openai-gpt4o",
    brand: "OpenAI",
    model: "GPT-4o",
    description: "Strong general reasoning via OpenRouter free tier.",
  },
  {
    value: "anthropic-claude35",
    brand: "Claude",
    model: "Claude 3.5 Sonnet",
    description: "Long-context plans with structured tables.",
  },
  {
    value: "local-airgapped",
    brand: "Local",
    model: "Llama-3 · air-gapped",
    description: "No cloud round-trip — ideal for air-gapped ops.",
  },
];

const VERBOSITY_OPTIONS: { value: ResponseVerbosity; label: string; size: number }[] = [
  { value: "concise", label: "Concise", size: 12 },
  { value: "balanced", label: "Balanced", size: 20 },
  { value: "detailed", label: "Detailed", size: 28 },
];

type DbTool = {
  key: AiToolKey;
  system: string;
  database: string;
  description: string;
};

const DB_TOOLS: DbTool[] = [
  {
    key: "readFloodPredictions",
    system: "Flood Predictions",
    database: "glofas_cache",
    description: "Live gauge & GLOFAS forecasts",
  },
  {
    key: "queryShelterCapacity",
    system: "Shelter Capacity",
    database: "shelter_db",
    description: "Occupancy + free berths per shelter",
  },
  {
    key: "accessResourceInventory",
    system: "Resource Inventory",
    database: "inventory_db",
    description: "Boats, ambulances & staging units",
  },
  {
    key: "readAttendanceLogs",
    system: "Attendance Logs",
    database: "responders_db",
    description: "Responder check-in & shift records",
  },
  {
    key: "modifyUserProfiles",
    system: "User Profiles",
    database: "accounts_db",
    description: "Elevate roles / edit responders",
  },
];

export default function AiSettingsPage() {
  const [provider, setProvider] = useState<AiProvider>("openai-gpt4o");
  const [verbosityIdx, setVerbosityIdx] = useState(1);
  const [readAccess, setReadAccess] = useState<Record<AiToolKey, boolean>>({
    readFloodPredictions: true,
    queryShelterCapacity: true,
    accessResourceInventory: true,
    readAttendanceLogs: true,
    modifyUserProfiles: false,
  });

  const currentVerbosity = VERBOSITY_OPTIONS[verbosityIdx];

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title="LLM Provider"
        description="Which model answers commands and drafts operational plans."
        icon={Bot}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PROVIDERS.map((p) => {
            const active = provider === p.value;
            return (
              <label
                key={p.value}
                className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition ${
                  active
                    ? "border-accent-purple bg-accent-purple/5 ring-1 ring-accent-purple/40"
                    : "border-border bg-secondary hover:border-accent-purple/50"
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.value}
                  checked={active}
                  onChange={() => setProvider(p.value)}
                  className="hidden"
                />
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      active
                        ? "bg-accent-purple/15 text-accent-purple"
                        : "bg-tertiary text-muted"
                    }`}
                  >
                    <Bot className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-sm font-bold text-primary">{p.brand}</span>
                  <span
                    className={`ml-auto flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      active ? "border-accent-purple" : "border-border"
                    }`}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-accent-purple" />}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-muted">{p.model}</span>
                <span className="text-xs leading-relaxed text-slate-400">
                  {p.description}
                </span>
              </label>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Response Verbosity"
        description="Drag to the snap point that suits briefing density."
        icon={MessageSquareText}
      >
        <div className="flex flex-col gap-4">
          {/* Speech bubbles scaling small → large */}
          <div className="flex items-end justify-center gap-6 rounded-xl border border-border bg-secondary px-6 py-6">
            {VERBOSITY_OPTIONS.map((level, index) => {
              const active = verbosityIdx === index;
              return (
                <div key={level.value} className="flex flex-col items-center gap-2">
                  <span
                    className={`flex items-end justify-center rounded-full border pb-1 transition-all duration-300 ${
                      active
                        ? "border-accent text-accent"
                        : "border-border text-muted opacity-50"
                    }`}
                    style={{
                      width: `${level.size + 30}px`,
                      height: `${level.size + 22}px`,
                    }}
                  >
                    <span
                      className="block rounded-full border"
                      style={{
                        width: `${level.size}px`,
                        height: `${level.size}px`,
                        borderColor: "currentColor",
                      }}
                    />
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${active ? "text-accent" : "text-slate-500"}`}
                  >
                    {level.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 3-snap slider */}
          <div className="px-1">
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={verbosityIdx}
              aria-label="Response verbosity"
              onChange={(e) => setVerbosityIdx(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-tertiary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent-purple"
              style={{
                background: `linear-gradient(to right, var(--accent-purple) 0%, var(--accent-purple) ${(verbosityIdx / 2) * 100}%, #1e293b ${(verbosityIdx / 2) * 100}%, #1e293b 100%)`,
              }}
            />
            <div className="mt-1 flex justify-between text-[10px] font-medium text-muted">
              <span>Concise</span>
              <span>Balanced</span>
              <span>Detailed</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted">
            Current:{" "}
            <span className="font-semibold text-accent-purple">
              {currentVerbosity.label}
            </span>{" "}
            — replies include tables, timelines and resource matrices.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Tool Access"
        description="Which databases the AI is permitted to read — guardrails, not guesses."
        icon={Database}
      >
        <div className="max-h-80 overflow-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-[var(--bg-tertiary)]">
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
                <th className="border-b border-subtle px-3 py-2.5 font-semibold">
                  System
                </th>
                <th className="border-b border-subtle px-3 py-2.5 font-semibold">
                  Database
                </th>
                <th className="border-b border-subtle px-3 py-2.5 font-semibold">
                  Description
                </th>
                <th className="border-b border-subtle px-3 py-2.5 text-right font-semibold">
                  Read access
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-secondary">
              {DB_TOOLS.map((tool) => (
                <tr key={tool.key} className="hover:bg-[var(--bg-tertiary)]/40">
                  <td className="px-3 py-2.5 font-semibold text-slate-100">
                    {tool.system}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">
                    {tool.database}
                  </td>
                  <td className="px-3 py-2.5 text-slate-300">{tool.description}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end">
                      <Toggle
                        checked={readAccess[tool.key]}
                        onChange={(v) =>
                          setReadAccess((prev) => ({ ...prev, [tool.key]: v }))
                        }
                        label={`Read access to ${tool.system}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded-md border border-subtle bg-[var(--bg-tertiary)] px-3 py-2 text-[11px] text-muted">
          Sensitive actions always route through the human-in-the-loop approval bar.
        </p>
      </SettingsSection>

      {/* Billing Caps Section */}
      <SettingsSection
        title="Billing Caps & Usage"
        description="Set spending limits for AI providers to prevent surprise bills."
        icon={DollarSign}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Groq */}
          <BillingCapCard
            provider="Groq"
            icon={TrendingUp}
            status="green"
            currentUsage={2.45}
            monthlyCap={20}
            requestsToday={156}
          />
          {/* OpenRouter */}
          <BillingCapCard
            provider="OpenRouter"
            icon={TrendingUp}
            status="amber"
            currentUsage={8.72}
            monthlyCap={15}
            requestsToday={89}
          />
          {/* Bluesminds */}
          <BillingCapCard
            provider="Bluesminds"
            icon={TrendingUp}
            status="green"
            currentUsage={0.15}
            monthlyCap={10}
            requestsToday={12}
          />
          {/* Total */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-[var(--bg-secondary)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary text-muted">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">Monthly Total</h3>
                <p className="text-xs text-muted">Combined across all providers</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold text-slate-100">$11.32</span>
                <span className="text-sm text-muted"> / $45.00</span>
              </div>
              <span className="text-xs font-medium text-emerald-400">25% used</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-tertiary">
              <div className="h-full w-[25%] rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs text-muted">
              Alert at 80% ($36.00). Caps reset on the 1st of each month.
            </p>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

function BillingCapCard({
  provider,
  icon: Icon,
  status,
  currentUsage,
  monthlyCap,
  requestsToday,
}: {
  provider: string;
  icon: typeof DollarSign;
  status: "green" | "amber" | "red";
  currentUsage: number;
  monthlyCap: number;
  requestsToday: number;
}) {
  const pct = Math.min(100, (currentUsage / monthlyCap) * 100);
  const barColor = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";
  const statusColors = { green: "bg-green-500", amber: "bg-amber-500", red: "bg-red-500" };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-[var(--bg-secondary)] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary text-muted">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">{provider}</h3>
            <p className="text-xs text-muted">{requestsToday} requests today</p>
          </div>
        </div>
        <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status]}`} />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xl font-bold text-slate-100">${currentUsage.toFixed(2)}</span>
          <span className="text-sm text-muted"> / ${monthlyCap.toFixed(2)}</span>
        </div>
        <span className="text-xs font-medium text-slate-400">{pct.toFixed(0)}% used</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-tertiary">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
