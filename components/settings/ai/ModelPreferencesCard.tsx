"use client";

// ---------------------------------------------------------------------
// components/settings/ai/ModelPreferencesCard.tsx — AI Assistant (Phase 4 · Step 2).
//
// "Model & Provider" card:
//   • Dropdown for the LLM provider — OpenAI GPT-4o, Anthropic Claude 3.5
//     Sonnet, Groq Llama-3, or Local/Air-Gapped (all free-tier routes).
//   • API key input (type="password") — stored only in local state.
//   • Helper note clarifying keys never leave the browser.
//   • "Test Connection" button: 1s spinner → green success toast.
//
// Backed by the central useAiSettings store (localStorage round-trip).
// ---------------------------------------------------------------------

import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  KeyRound,
  Loader2,
  PlugZap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAiSettings } from "@/lib/settings/AiSettingsContext";
import type { ProviderProbeReport } from "@/lib/ai/openrouter";
import { AI_PROVIDERS, type AiProvider } from "@/lib/settings/ai-settings";

function resolverLabel(name: string): string {
  const labels: Record<string, string> = {
    groq: "Groq",
    "groq-backup": "Groq (backup key)",
    openrouter: "OpenRouter",
    "openrouter-backup": "OpenRouter (backup key)",
    bluesminds: "Bluesminds",
  };
  return labels[name] ?? name;
}

export default function ModelPreferencesCard() {
  const { settings, update } = useAiSettings();
  const [testing, setTesting] = useState(false);
  const [lastProbe, setLastProbe] = useState<ProviderProbeReport | null>(null);

  function setProvider(provider: AiProvider) {
    update({ provider });
  }

  function setApiKey(apiKey: string) {
    update({ apiKey });
  }

  async function testConnection() {
    if (testing) return;
    setTesting(true);
    try {
      const res = await fetch(
        `/api/ai/test?provider=${encodeURIComponent(settings.provider)}`,
      );
      const body = (await res.json()) as
        { error?: string } | Partial<ProviderProbeReport>;
      if (!res.ok) {
        const errorBody = body as { error?: string };
        throw new Error(errorBody.error ?? `Probe failed (HTTP ${res.status}).`);
      }
      const probe = body as ProviderProbeReport;
      if (!probe.reachable) {
        toast.error(
          probe.results === 0
            ? "No AI provider keys on the server — add GROQ_API_KEY (or OPENROUTER_API_KEY) to the backend."
            : "Every configured provider failed the probe — check the backend environment keys.",
        );
      } else {
        toast.success(
          probe.winner
            ? `Connection Successful · ${resolverLabel(probe.winner)}`
            : "Connection Successful",
        );
      }
      setLastProbe(probe);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown connection error";
      toast.error(`Connection failed — ${message}`);
      setLastProbe(null);
    } finally {
      setTesting(false);
    }
  }

  const activeProvider =
    AI_PROVIDERS.find((option) => option.value === settings.provider) ?? AI_PROVIDERS[0];

  return (
    <section
      data-settings-key="ai-model"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/10">
          <Cpu className="h-5 w-5 text-fuchsia-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-fuchsia-300/80">MODEL & PROVIDER</p>
          <h2 className="mt-0.5 text-lg font-bold">Model &amp; Provider</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Choose which language model powers your AI Command Assistant. Cloud providers
        route through our free-tier endpoints; the local option keeps everything fully
        air-gapped.
      </p>

      {/* Provider dropdown */}
      <div className="mt-5">
        <label
          htmlFor="ai-provider"
          className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-400"
        >
          LLM PROVIDER
        </label>
        <div className="relative">
          <select
            id="ai-provider"
            value={settings.provider}
            onChange={(event) => setProvider(event.target.value as AiProvider)}
            className="w-full appearance-none rounded-md border border-[#1c2740] bg-[#0a0f1d] px-3 py-2.5 pr-9 text-sm text-slate-200 outline-none transition focus:border-fuchsia-400/60"
          >
            {AI_PROVIDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.hint}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
            <svg
              className="h-4 w-4 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {activeProvider.label} · {activeProvider.hint}
        </p>
      </div>

      {/* API key */}
      <div className="mt-4">
        <label
          htmlFor="ai-api-key"
          className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-400"
        >
          API KEY
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
            <KeyRound className="h-4 w-4 text-slate-500" aria-hidden />
          </span>
          <input
            id="ai-api-key"
            type="password"
            value={settings.apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="••••••••••••••••"
            autoComplete="off"
            className="w-full rounded-md border border-[#1c2740] bg-[#0a0f1d] py-2.5 pl-9 pr-3 text-sm text-slate-200 outline-none transition focus:border-fuchsia-400/60"
          />
        </div>
        <p className="mt-2 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
          <ShieldCheck
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400"
            aria-hidden
          />
          Keys are stored securely in local state and never sent to our servers. Leave
          blank to use the default organizational tier.
        </p>
      </div>

      {/* Test connection */}
      <div className="mt-5 border-t border-[#1c2740] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Verifies this provider family&apos;s server chain. Your local key never leaves
            this browser.
          </p>
          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-70"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <PlugZap className="h-4 w-4" aria-hidden />
            )}
            {testing ? "Testing…" : "Test Connection"}
          </button>
        </div>

        {lastProbe && (
          <div className="mt-3 rounded-md border border-[#1c2740] bg-surface-muted/40 p-3">
            <p
              className={`flex items-center gap-2 text-[11px] font-semibold ${
                lastProbe.reachable ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {lastProbe.reachable ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              {lastProbe.reachable
                ? `Server chain healthy · ${resolverLabel(lastProbe.winner ?? "")}`
                : `Server chain unreachable — ${lastProbe.results} provider key(s) probed`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {lastProbe.statuses.map((status) => (
                <span
                  key={status.name}
                  className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    status.status === "healthy"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {resolverLabel(status.name)} ·{" "}
                  {status.status === "healthy" ? "reachable" : "failed"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md border border-[#1c2740] bg-surface-muted/40 p-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" aria-hidden />
        <p className="text-[11px] leading-relaxed text-slate-500">
          The assistant defaults to the bundled organizational tier. Adding a key
          overrides the tier for this device only.
        </p>
      </div>
    </section>
  );
}
