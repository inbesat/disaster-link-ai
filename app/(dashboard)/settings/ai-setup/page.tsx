"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/ai-setup/page.tsx — Offline-First Architecture
// Phase 4 · AI Setup onboarding.
//
// Step 1 · Choose Your AI — three tier cards (Cloud Only / Balanced /
// Full Offline) with the device capability chips (RAM, WebGPU, storage)
// pre-selecting the recommended tier.
// Step 2 · Download — animated brain + gradient progress bar, percentage,
// ETA, "Continue in background".
// Step 3 · Test — side-by-side Cloud vs Local replies to the same
// pre-loaded question ("What should I do during a flood?").
// ---------------------------------------------------------------------

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CloudOff,
  CloudUpload,
  Cpu,
  Gauge,
  HardDrive,
  Loader2,
  Play,
  Sparkles,
} from "lucide-react";
import { useModelSetup } from "@/hooks/useModelSetup";
import { describeBackend, type DeviceCapabilities } from "@/lib/ai/setup/capabilities";
import type { AiModelOption } from "@/lib/ai/setup/model-tiers";
import { formatBytes } from "@/lib/offline-sync/quota";

const TEST_PROMPT = "What should I do during a flood?";

export default function AiSetupPage() {
  const router = useRouter();
  const setup = useModelSetup();

  return (
    <div className="min-h-full bg-[var(--bg-primary)]">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 p-4 pt-10 sm:p-6">
        <header className="flex flex-col gap-1">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
            Offline-First · Local AI
          </p>
          <h1 className="text-2xl font-black text-primary">Set up your AI</h1>
          <p className="text-sm text-muted">
            Choose how this device answers when the network drops — then test it live.
          </p>
        </header>

        <StepIndicator current={setup.step} />

        {setup.step === "choose" && (
          <ChooseStep
            checking={setup.checkingCapabilities}
            recommendedTier={setup.recommendedTier}
            selectedTier={setup.selectedTier}
            capabilities={setup.capabilities}
            onSelect={setup.selectTier}
          />
        )}

        {setup.step === "download" && (
          <DownloadStep
            model={setup.selectedModel}
            progress={setup.progress}
            etaSeconds={setup.etaSeconds}
            active={setup.downloadActive}
            complete={setup.downloadComplete}
            onStart={() => void setup.startDownload()}
            onBackground={setup.skipSetup}
          />
        )}

        {setup.step === "test" && (
          <TestStep
            cloudReply={setup.cloudReply}
            localReply={setup.localReply}
            testing={setup.testing}
            selectedModel={setup.selectedModel}
            capabilities={setup.capabilities}
            onTest={() => void setup.runComparisonTest()}
            onDone={() => router.push("/settings/storage")}
          />
        )}

        <div className="flex items-center justify-center gap-2 pb-6 text-[11px] text-muted">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden />
          You can change this or re-download the model any time in Settings · Storage.
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: "choose" | "download" | "test" }) {
  const steps = [
    { id: "choose", label: "Choose AI" },
    { id: "download", label: "Download" },
    { id: "test", label: "Test" },
  ] as const;
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-3">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                i <= idx ? "bg-accent text-slate-950" : "bg-tertiary text-muted"
              }`}
            >
              {i < idx ? "✓" : i + 1}
            </span>
            <span
              className={`text-xs font-semibold ${
                i <= idx ? "text-slate-200" : "text-muted"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <span className="h-px w-6 bg-subtle" />}
        </div>
      ))}
    </div>
  );
}

function CapabilityChips({ caps }: { caps: DeviceCapabilities | null }) {
  if (!caps) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Checking this device…
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip icon="ram" label={`${caps.deviceMemoryGb} GB RAM`} />
      <Chip icon="cpu" label={describeBackend(caps)} />
      <Chip icon="disk" label={`${formatBytes(caps.storageFreeBytes)} free`} />
      {caps.gpu === "webgpu" ? (
        <Chip icon="gpu" label="WebGPU ready" good />
      ) : caps.wasmSimd ? (
        <Chip icon="gpu" label="WASM fallback (slower)" warn />
      ) : (
        <Chip icon="gpu" label="No WebGPU — cloud only" warn />
      )}
    </div>
  );
}

function Chip({
  icon,
  label,
  good,
  warn,
}: {
  icon: "ram" | "cpu" | "disk" | "gpu";
  label: string;
  good?: boolean;
  warn?: boolean;
}) {
  const Icon =
    icon === "ram" ? Gauge : icon === "cpu" ? Cpu : icon === "disk" ? HardDrive : CloudOff;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        warn
          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
          : good
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : "border-subtle bg-tertiary text-muted"
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

function ChooseStep({
  checking,
  recommendedTier,
  selectedTier,
  capabilities,
  onSelect,
}: {
  checking: boolean;
  recommendedTier: string | null;
  selectedTier: string | null;
  capabilities: DeviceCapabilities | null;
  onSelect: (id: "cloud-only" | "balanced" | "full-offline") => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-subtle bg-secondary px-4 py-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">
          Device capability
        </p>
        <CapabilityChips caps={capabilities} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {setupTiers.map((tier) => {
          const recommended = tier.id === recommendedTier;
          const selected = tier.id === selectedTier;
          const Icon = tier.id === "cloud-only" ? CloudUpload : tier.id === "balanced" ? Sparkles : BrainCircuit;
          return (
            <button
              key={tier.id}
              type="button"
              disabled={checking}
              onClick={() => onSelect(tier.id)}
              className={`group relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-accent bg-accent/10 ring-1 ring-accent/40"
                  : "border-subtle bg-secondary hover:border-accent/50"
              }`}
            >
              {recommended && (
                <span className="absolute right-3 top-3 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Recommended
                </span>
              )}
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  selected ? "bg-accent text-slate-950" : "bg-tertiary text-muted"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-base font-bold text-slate-100">{tier.label}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted">{tier.badge}</p>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{tier.description}</p>
              {selected && (
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-accent">
                  Selected <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const setupTiers = [
  {
    id: "cloud-only" as const,
    label: "Cloud Only",
    badge: "0 MB",
    description: "Every answer routes to the cloud planner. No local model, no offline AI.",
  },
  {
    id: "balanced" as const,
    label: "Balanced",
    badge: "600 MB–1.3 GB",
    description: "Cloud while online, local model in blackouts. Best of both worlds.",
  },
  {
    id: "full-offline" as const,
    label: "Full Offline",
    badge: "1.3 GB",
    description: "Local model first, always. Needs WebGPU + free storage.",
  },
];

function DownloadStep({
  model,
  progress,
  etaSeconds,
  active,
  complete,
  onStart,
  onBackground,
}: {
  model: AiModelOption | null;
  progress: number;
  etaSeconds: number | null;
  active: boolean;
  complete: boolean;
  onStart: () => void;
  onBackground: () => void;
}) {
  const pct = Math.round(progress * 100);
  const total = model?.sizeBytes ?? 1.3 * 1024 * 1024 * 1024;
  const doneBytes = progress * total;
  const statusLabel = complete
    ? "Model installed"
    : active
      ? "Downloading…"
      : "Ready to download";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-subtle bg-secondary p-6">
      <div className="flex items-center gap-4">
        <span
          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${
            active || complete ? "bg-accent/15 text-accent" : "bg-tertiary text-muted"
          }`}
        >
          <BrainCircuit className="h-7 w-7" aria-hidden />
          {active && (
            <span className="absolute -inset-1 animate-ping rounded-2xl border border-accent/40" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-100">{model?.label ?? "Local model"}</p>
          <p className="font-mono text-[11px] text-muted">
            {formatBytes(doneBytes)} / {formatBytes(total)}
          </p>
        </div>
        <span className="ml-auto text-2xl font-black tabular-nums text-slate-100">{pct}%</span>
      </div>

      <div
        className="h-3 overflow-hidden rounded-full bg-tertiary"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{active ? `ETA ~${etaSeconds ? Math.ceil(etaSeconds).toLocaleString() + "s" : "…"}` : statusLabel}</span>
        <span className="font-mono text-[11px]">
          {formatBytes(total)} total · resumable
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!complete && (
          <button
            type="button"
            disabled={active}
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {active ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Downloading…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden />
                {progress > 0 ? "Resume download" : "Start download"}
              </>
            )}
          </button>
        )}
        {!active && (
          <button
            type="button"
            onClick={onBackground}
            className="inline-flex items-center gap-2 rounded-lg border border-subtle bg-secondary px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-tertiary"
          >
            Continue in background
          </button>
        )}
        {complete && (
          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-5 py-2.5 text-sm font-bold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Ready to test
          </span>
        )}
      </div>
    </div>
  );
}

function TestStep({
  cloudReply,
  localReply,
  testing,
  selectedModel,
  capabilities,
  onTest,
  onDone,
}: {
  cloudReply: string | null;
  localReply: string | null;
  testing: boolean;
  selectedModel: AiModelOption | null;
  capabilities: DeviceCapabilities | null;
  onTest: () => void;
  onDone: () => void;
}) {
  const canLocal = !!(localReply && !localReply.includes("unavailable"));
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-subtle bg-secondary p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">
          Test question
        </p>
        <p className="text-lg font-bold text-slate-100">“{TEST_PROMPT}”</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2">
            <CloudUpload className="h-4 w-4 text-sky-400" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
              Cloud Response
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            {testing
              ? "Generating…"
              : cloudReply ?? "Run the test to see the cloud planner's reply."}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-violet-400" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Local Response
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            {testing
              ? "Generating…"
              : localReply ?? "Run the test to exercise the local model."}
          </p>
          {canLocal && (
            <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Offline-capable
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={testing}
          onClick={onTest}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          {testing ? "Testing…" : "Run comparison"}
        </button>
        {localReply && (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center gap-2 rounded-lg border border-subtle bg-secondary px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-tertiary"
          >
            Finish setup
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted">
        <Cpu className="h-3.5 w-3.5" aria-hidden />
        Model: {selectedModel?.label ?? "cloud-only"} ·{" "}
        {capabilities ? describeBackend(capabilities) : "capabilities pending"}
      </div>
    </div>
  );
}