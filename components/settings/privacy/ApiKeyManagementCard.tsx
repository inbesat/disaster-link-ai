"use client";

// ---------------------------------------------------------------------
// components/settings/privacy/ApiKeyManagementCard.tsx — Privacy (Phase 6 · Step 5).
//
// Third-Party API Keys (developer integrations panel):
//   • Data table of active mock keys — Name, Scope, Created, Last Used,
//     IP — with a red "Revoke" action per row.
//   • "Generate New API Key" button opens a small modal to name the key
//     and pick a scope (Read Only vs Read/Write). Creating returns a mock
//     `bs_live_…` alphanumeric secret with a prominent "copy it now"
//     warning (the full secret is shown exactly once).
//   • Revoked keys stay listed (greyed) so the audit trail is visible.
//   • All state persists through lib/settings/privacy-settings.ts.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  createApiKey,
  revokeApiKey,
  type ApiKeyRecord,
  type ApiKeyScope,
} from "@/lib/settings/privacy-settings";

const SCOPE_STYLES: Record<ApiKeyScope, string> = {
  read: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  read_write: "border-amber-500/40 bg-amber-500/10 text-amber-300",
};

const SCOPE_LABELS: Record<ApiKeyScope, string> = {
  read: "Read Only",
  read_write: "Read/Write",
};

const SCOPE_OPTIONS: { value: ApiKeyScope; label: string; hint: string }[] = [
  { value: "read", label: "Read Only", hint: "Query data only" },
  { value: "read_write", label: "Read/Write", hint: "Query + create/update records" },
];

export default function ApiKeyManagementCard({
  apiKeys,
  onChange,
}: {
  apiKeys: ApiKeyRecord[];
  onChange: (keys: ApiKeyRecord[]) => void;
}) {
  // generate modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [scope, setScope] = useState<ApiKeyScope>("read");
  const [revealed, setRevealed] = useState<{ prefix: string; secret: string } | null>(null);

  function openModal() {
    setLabel("");
    setScope("read");
    setModalOpen(true);
  }

  function handleGenerate() {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Give the key a name (e.g. 'Drone-Telemetry-Feed').");
      return;
    }
    const { key, secret } = createApiKey(trimmed, scope);
    onChange([...apiKeys, key]);
    setModalOpen(false);
    setRevealed({ prefix: key.prefix, secret });
  }

  function handleRevoke(id: string, currentLabel: string) {
    onChange(revokeApiKey(id, apiKeys));
    toast(`Key "${currentLabel}" revoked.`, { duration: 2500 });
  }

  return (
    <>
      <section
        data-settings-key="privacy-api-keys"
        className="rounded-eoc border border-panel-border bg-surface p-5"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <KeyRound className="h-5 w-5 text-emerald-300" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="eoc-label text-emerald-300/80">DEVELOPER INTEGRATIONS</p>
            <h2 className="mt-0.5 text-lg font-bold">Third-Party API Keys</h2>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Generate New API Key
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          Keys authenticate third-party integrations and field automation.
          Full secrets are shown once at creation and never stored in plaintext.
        </p>

        {/* Key list */}
        <div className="mt-5 overflow-hidden rounded-md border border-panel-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-panel-border bg-surface-muted/40 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Name</th>
                  <th className="px-4 py-2.5 font-semibold">Scope</th>
                  <th className="px-4 py-2.5 font-semibold">Created</th>
                  <th className="px-4 py-2.5 font-semibold">Last Used</th>
                  <th className="px-4 py-2.5 font-semibold">IP</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-divide">
                {apiKeys.map((key) => (
                  <tr
                    key={key.id}
                    className={`transition hover:bg-surface-muted/30 ${
                      key.revoked ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200">{key.label}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {key.prefix}…{key.revoked ? " (revoked)" : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-eoc-tiny font-bold uppercase tracking-wider ${SCOPE_STYLES[key.scope]}`}
                      >
                        {SCOPE_LABELS[key.scope]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{key.createdAt}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {key.lastUsed ?? "Never"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {key.ip ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!key.revoked && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(key.id, key.label)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {apiKeys.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No API keys issued yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Rotation recommended every 90 days. Revoked keys stop working
          immediately but remain in the audit trail.
        </p>
      </section>

      {/* Generate API key modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-generate-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-eoc border border-emerald-500/50 bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <KeyRound className="h-5 w-5 text-emerald-300" aria-hidden />
                </div>
                <div>
                  <h2 id="api-generate-title" className="text-base font-bold">
                    Generate New API Key
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    The secret is shown once — copy it right away.
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
              htmlFor="api-key-label"
              className="mt-5 block text-xs font-semibold text-slate-300"
            >
              Key name
            </label>
            <input
              id="api-key-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Drone-Telemetry-Feed"
              maxLength={80}
              className="mt-2 w-full rounded-md border border-panel-border bg-[#0a0f1a] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400/60"
            />

            <p className="mt-4 text-xs font-semibold text-slate-300">Scope</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={scope === option.value}
                  onClick={() => setScope(option.value)}
                  className={`rounded-md border px-3 py-2.5 text-left transition ${
                    scope === option.value
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-panel-border bg-surface-muted/40 hover:border-emerald-400/40"
                  }`}
                >
                  <p className="text-sm font-bold text-slate-200">{option.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{option.hint}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-panel-borderHover px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-md border border-emerald-400/60 bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/25"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-time secret reveal modal */}
      {revealed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-secret-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-eoc border border-emerald-500/50 bg-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden />
              </div>
              <div>
                <h2 id="api-secret-title" className="text-base font-bold">
                  Key created — copy it now
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  For security, the full secret is shown only once. Store it in
                  your integration config, then it&apos;s gone forever.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-md border border-panel-border bg-[#0a0f1a] px-3 py-3">
              <code className="flex-1 break-all font-mono text-xs font-bold text-emerald-200">
                {revealed.secret}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(revealed.secret);
                  toast.success("Secret copied to clipboard.");
                }}
                aria-label="Copy secret"
                className="rounded-md border border-panel-border p-2 text-slate-400 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setRevealed(null)}
                className="inline-flex items-center gap-2 rounded-md border border-emerald-400/60 bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/25"
              >
                <Check className="h-4 w-4" aria-hidden />
                I&apos;ve saved it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
