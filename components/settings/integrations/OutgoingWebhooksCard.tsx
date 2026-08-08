"use client";

// ---------------------------------------------------------------------
// components/settings/integrations/OutgoingWebhooksCard.tsx — Integrations (Phase 8 · Step 5).
//
// Outgoing Event Webhooks:
//   • List of active webhooks (Slack Command Center Channel, State Gov
//     Portal, …) with event-trigger chips, masked secret preview and a
//     pulsing "Active" indicator.
//   • "Add Webhook" opens a modal: label, endpoint URL, secret key (with
//     show/hide toggle) and a multi-select of event triggers.
//   • "Ping (Test)" per row: simulated 1s delivery round-trip, then a
//     green success toast. Rows can also be removed.
//
// The webhook list itself lives in the shared useIntegrationSettings
// store (Step 10) so adds/removes/pings persist across refreshes.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  RadioTower,
  Trash2,
  Webhook,
  X,
} from "lucide-react";
import { useIntegrationSettings } from "@/lib/integrations-settings-mock";
import type {
  IntegrationWebhook,
  WebhookTriggerId,
} from "@/lib/settings/integrations-settings";

const EVENT_TRIGGERS: { id: WebhookTriggerId; label: string; hint: string }[] = [
  {
    id: "alert",
    label: "New Alert Issued",
    hint: "Critical / warning alert published",
  },
  {
    id: "plan",
    label: "Plan Approved",
    hint: "AI emergency plan approved by an admin",
  },
  {
    id: "resource",
    label: "Resource Depleted",
    hint: "Stock falls below the low-stock threshold",
  },
];

const TRIGGER_LABELS = Object.fromEntries(
  EVENT_TRIGGERS.map((t) => [t.id, t.label]),
) as Record<WebhookTriggerId, string>;

const TRIGGER_STYLES: Record<WebhookTriggerId, string> = {
  alert: "border-red-400/40 bg-red-500/10 text-red-300",
  plan: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300",
  resource: "border-amber-400/40 bg-amber-500/10 text-amber-300",
};

function maskSecret(secret: string): string {
  if (!secret) return "No secret set";
  // Show a short real prefix so rows stay distinguishable.
  return `whsec_${secret.slice(0, 3)}${"•".repeat(8)}`;
}

export default function OutgoingWebhooksCard() {
  const { settings, addWebhook, removeWebhook, markWebhookPinged } =
    useIntegrationSettings();
  const webhooks = settings.webhooks;

  const [pingingId, setPingingId] = useState<string | null>(null);
  const pingTimer = useRef<number | null>(null);

  // Clear any in-flight ping probe on unmount.
  useEffect(() => {
    return () => {
      if (pingTimer.current !== null) window.clearTimeout(pingTimer.current);
    };
  }, []);

  // Add-webhook modal state.
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [triggers, setTriggers] = useState<WebhookTriggerId[]>([]);

  // Close the modal on Escape.
  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setModalOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  function openModal() {
    setName("");
    setEndpoint("");
    setSecret("");
    setShowSecret(false);
    setTriggers([]);
    setModalOpen(true);
  }

  function toggleTrigger(id: WebhookTriggerId) {
    setTriggers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function handleAdd() {
    const trimmedEndpoint = endpoint.trim();
    if (!name.trim()) {
      toast.error("Give the webhook a label (e.g. 'Slack Command Center').");
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmedEndpoint)) {
      toast.error("Endpoint URL must start with http:// or https://.");
      return;
    }
    if (triggers.length === 0) {
      toast.error("Select at least one event trigger.");
      return;
    }
    addWebhook({
      name: name.trim(),
      endpoint: trimmedEndpoint,
      secret: secret.trim(),
      triggers,
      lastPing: null,
    });
    setModalOpen(false);
  }

  function handlePing(id: string) {
    if (pingingId) return;
    setPingingId(id);
    // Simulated delivery round-trip to the endpoint.
    pingTimer.current = window.setTimeout(() => {
      markWebhookPinged(id);
      setPingingId(null);
      pingTimer.current = null;
      toast.success("Ping delivered — 200 OK.");
    }, 1000);
  }

  function handleRemove(id: string, hookName: string) {
    removeWebhook(id, hookName);
  }

  return (
    <>
      <section
        data-settings-key="integrations-webhooks"
        className="rounded-eoc border border-[#1c2740] bg-surface p-5"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Webhook className="h-5 w-5 text-amber-300" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="eoc-label text-amber-300/80">OUTBOUND EVENT CALLBACKS</p>
            <h2 className="mt-0.5 text-lg font-bold">Outgoing Event Webhooks</h2>
          </div>
          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-amber-200">
            {webhooks.length} active
          </span>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-500/20"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add Webhook
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          Push live disaster events to external systems — command channels,
          govt portals, internal dashboards. Every delivery is signed with the
          endpoint&apos;s secret key.
        </p>

        {/* Webhook list */}
        <div className="mt-5 space-y-3">
          {webhooks.map((hook: IntegrationWebhook) => (
            <div
              key={hook.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-[#1c2740] bg-surface-muted/40 p-3.5"
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
                <Webhook className="h-4 w-4 text-amber-300" aria-hidden />
                {/* Active pulse */}
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              </span>

              <div className="min-w-0 flex-1 basis-52">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-100">
                  <span className="truncate">{hook.name}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                    Active
                  </span>
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                  <Link2 className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{hook.endpoint}</span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">
                  Last ping: {hook.lastPing ?? "never"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {hook.triggers.map((id) => (
                  <span
                    key={id}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TRIGGER_STYLES[id]}`}
                  >
                    {TRIGGER_LABELS[id]}
                  </span>
                ))}
                <span
                  title="Stored server-side — never logged"
                  className="flex items-center gap-1 rounded-full border border-[#2c3f6d] bg-[#0a0f1d] px-2 py-0.5 font-mono text-[10px] text-slate-500"
                >
                  <KeyRound className="h-3 w-3" aria-hidden />
                  {maskSecret(hook.secret)}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {pingingId === hook.id ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#2c3f6d] px-3 py-1.5 text-xs font-semibold text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Pinging…
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePing(hook.id)}
                    disabled={pingingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#2c3f6d] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-200 disabled:cursor-wait disabled:opacity-50"
                  >
                    <RadioTower className="h-3.5 w-3.5" aria-hidden />
                    Ping (Test)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(hook.id, hook.name)}
                  aria-label={`Remove webhook ${hook.name}`}
                  title="Remove webhook"
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ))}

          {webhooks.length === 0 && (
            <div className="rounded-md border border-dashed border-[#2c3f6d] bg-surface-muted/40 px-4 py-8 text-center text-sm text-slate-500">
              No webhooks configured yet — add one to push events to an
              external system.
            </div>
          )}
        </div>

        <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
          Failed deliveries retry with exponential backoff; secrets are never
          logged. Demo fixtures — endpoints are not called.
        </p>
      </section>

      {/* Add webhook modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="webhook-add-title"
          aria-describedby="webhook-add-subtitle"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-eoc border border-amber-500/50 bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Webhook className="h-5 w-5 text-amber-300" aria-hidden />
                </div>
                <div>
                  <h2 id="webhook-add-title" className="text-base font-bold">
                    Add Outgoing Webhook
                  </h2>
                  <p id="webhook-add-subtitle" className="mt-0.5 text-xs text-slate-500">
                    External endpoints receive POSTs when triggers fire.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-surface-muted hover:text-slate-200"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <label
              htmlFor="webhook-name"
              className="mt-5 block text-xs font-semibold text-slate-300"
            >
              Label
            </label>
            <input
              id="webhook-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Slack Command Center Channel"
              maxLength={80}
              autoFocus
              className="mt-2 w-full rounded-md border border-[#1c2740] bg-[#0a0f1d] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/60"
            />

            <label
              htmlFor="webhook-endpoint"
              className="mt-4 block text-xs font-semibold text-slate-300"
            >
              Endpoint URL
            </label>
            <div className="relative mt-2">
              <Link2
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <input
                id="webhook-endpoint"
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://your-system.example.com/hooks/drip"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-md border border-[#1c2740] bg-[#0a0f1d] py-2 pl-9 pr-3 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/60"
              />
            </div>

            <label
              htmlFor="webhook-secret"
              className="mt-4 block text-xs font-semibold text-slate-300"
            >
              Secret Key
            </label>
            <div className="relative mt-2">
              <KeyRound
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <input
                id="webhook-secret"
                type={showSecret ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="whsec_••••••••••"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-md border border-[#1c2740] bg-[#0a0f1d] py-2 pl-9 pr-9 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/60"
              />
              <button
                type="button"
                onClick={() => setShowSecret((prev) => !prev)}
                aria-label={showSecret ? "Hide secret key" : "Show secret key"}
                aria-pressed={showSecret}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-slate-300"
              >
                {showSecret ? (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            </div>

            <p className="mt-4 text-xs font-semibold text-slate-300">
              Event Triggers
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {EVENT_TRIGGERS.map((trigger) => {
                const selected = triggers.includes(trigger.id);
                return (
                  <button
                    key={trigger.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTrigger(trigger.id)}
                    className={`rounded-md border px-3 py-2.5 text-left transition ${
                      selected
                        ? "border-amber-400/60 bg-amber-500/10"
                        : "border-[#1c2740] bg-surface-muted/40 hover:border-amber-400/40"
                    }`}
                  >
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 ${
                          selected ? "text-amber-300" : "text-slate-600"
                        }`}
                        aria-hidden
                      />
                      {trigger.label}
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                      {trigger.hint}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-[#2c3f6d] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/60 bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-500/25"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
