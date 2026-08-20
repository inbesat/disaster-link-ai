"use client";

// ---------------------------------------------------------------------
// components/settings/integrations/TelecomApiCard.tsx — Integrations (Phase 8 · Step 3).
//
// Telecom & Broadcast Gateways:
//   • Credential fields for Twilio (Account SID + Auth Token) and
//     Fast2SMS (API key) — password-masked with show/hide toggles.
//   • "Send Test SMS" opens a small modal: enter a phone number, pick
//     the gateway, then a simulated API dispatch (spinner) resolves to
//     a green success toast with the simulated message ID.
// ---------------------------------------------------------------------

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

type GatewayId = "twilio" | "fast2sms";

type CredentialField = {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
};

const GATEWAYS: {
  id: GatewayId;
  name: string;
  hint: string;
  icon: typeof Smartphone;
  fields: CredentialField[];
}[] = [
  {
    id: "twilio",
    name: "Twilio",
    hint: "Primary SMS + automated voice fallback",
    icon: MessageSquareText,
    fields: [
      {
        id: "sid",
        label: "Account SID",
        hint: "AC••••••••••••••••••••••••••••••",
        placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      },
      {
        id: "token",
        label: "Auth Token",
        hint: "Secret — used only server-side",
        placeholder: "••••••••••••••••••••••••",
      },
    ],
  },
  {
    id: "fast2sms",
    name: "Fast2SMS",
    hint: "Indian-market SMS gateway for alerts",
    icon: Send,
    fields: [
      {
        id: "key",
        label: "API Key",
        hint: "Secret — used only server-side",
        placeholder: "fast2sms_••••••••••",
      },
    ],
  },
];

const TEST_MESSAGE =
  "🚨 DRIP test: This is a test alert from your district command center. Reply STOP to opt out.";

export default function TelecomApiCard() {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [gateway, setGateway] = useState<GatewayId>("twilio");
  const [sending, setSending] = useState(false);

  function setCredential(fieldId: string, value: string) {
    setCredentials((prev) => ({ ...prev, [fieldId]: value }));
  }

  function toggleVisible(fieldId: string) {
    setVisible((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  }

  function closeModal() {
    if (sending) return;
    setModalOpen(false);
    setPhone("");
    setGateway("twilio");
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);

    // Simulated gateway round-trip — ~1.5s then a green success toast.
    window.setTimeout(() => {
      setSending(false);
      const prettyPhone = `+91 ${phone}`;
      const gatewayName = gateway === "twilio" ? "Twilio" : "Fast2SMS";
      const messageId = `SM${Math.random().toString(36).slice(2, 8).toUpperCase()}${Math.floor(
        100 + Math.random() * 900,
      )}`;
      setModalOpen(false);
      setPhone("");
      toast.success(
        `Test SMS dispatched to ${prettyPhone} via ${gatewayName} — message ID ${messageId}.`,
        { duration: 4000 },
      );
    }, 1500);
  }

  return (
    <>
      <section
        data-settings-key="integrations-sms"
        className="rounded-eoc border border-panel-border bg-surface p-5"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Smartphone className="h-5 w-5 text-emerald-300" aria-hidden />
          </div>
          <div>
            <p className="eoc-label text-emerald-300/80">TELECOM · BROADCAST GATEWAYS</p>
            <h2 className="mt-0.5 text-lg font-bold">
              Telecom &amp; Broadcast Gateways
            </h2>
          </div>
          <span className="ml-auto rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-emerald-200">
            2 gateways
          </span>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          Connect the critical-alert delivery layer. Credentials are masked,
          stored encrypted, and never exposed to the browser beyond this panel.
        </p>

        {/* Gateway credential rows */}
        <div className="mt-5 space-y-3">
          {GATEWAYS.map((gateway) => {
            const GatewayIcon = gateway.icon;
            return (
              <div
                key={gateway.id}
                className="rounded-md border border-panel-border bg-surface-muted/40 p-3.5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
                    <GatewayIcon className="h-4 w-4 text-emerald-300" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-100">{gateway.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{gateway.hint}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    <ShieldCheck className="h-3 w-3" aria-hidden />
                    Encrypted
                  </span>
                </div>

                {/* Credential fields */}
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {gateway.fields.map((field) => {
                    const fieldId = `${gateway.id}-${field.id}`;
                    const isVisible = visible[fieldId];
                    return (
                      <div key={fieldId} className="relative">
                        <label
                          htmlFor={fieldId}
                          className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          {field.label}
                        </label>
                        <p className="mb-1.5 text-[10px] text-slate-500">
                          {field.hint}
                        </p>
                        <div className="relative">
                          <KeyRound
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                            aria-hidden
                          />
                          <input
                            id={fieldId}
                            type={isVisible ? "text" : "password"}
                            value={credentials[fieldId] ?? ""}
                            onChange={(e) => setCredential(fieldId, e.target.value)}
                            placeholder={field.placeholder}
                            aria-label={`${gateway.name} ${field.label}`}
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full rounded-md border border-panel-border bg-[#0a0f1d] py-2 pl-9 pr-9 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400/60"
                          />
                          <button
                            type="button"
                            onClick={() => toggleVisible(fieldId)}
                            aria-label={
                              isVisible
                                ? `Hide ${gateway.name} ${field.label}`
                                : `Show ${gateway.name} ${field.label}`
                            }
                            aria-pressed={isVisible}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-slate-300"
                          >
                            {isVisible ? (
                              <EyeOff className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <Eye className="h-3.5 w-3.5" aria-hidden />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Send Test SMS */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-emerald-200">
                Test the gateway end-to-end
              </p>
              <p className="text-xs text-slate-400">
                Dispatch a real (simulated) test SMS to verify delivery before
                an actual alert.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(16,185,129,0.3)] transition hover:bg-emerald-500 active:scale-[0.98]"
          >
            <Send className="h-4 w-4" aria-hidden />
            Send Test SMS
          </button>
        </div>

        <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Demo fixtures — no real SMS is sent and keys are never persisted.
        </p>
      </section>

      {/* Test SMS modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="test-sms-modal-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSend}
            className="w-full max-w-md rounded-eoc border border-emerald-500/40 bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <MessageSquareText className="h-5 w-5 text-emerald-300" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="test-sms-modal-title"
                  className="text-base font-bold text-emerald-200"
                >
                  Send Test SMS
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Simulated dispatch — verify the gateway chain before go-live.
                </p>
              </div>
            </div>

            {/* Phone number */}
            <label
              htmlFor="test-sms-phone"
              className="mt-5 block text-xs font-semibold text-slate-300"
            >
              Recipient phone number
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded border border-panel-borderHover bg-[#1c2740] px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                +91
              </span>
              <input
                id="test-sms-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))
                }
                placeholder="9876543210"
                autoFocus
                required
                pattern="[0-9]{10}"
                className="w-full rounded-md border border-panel-border bg-[#0a0f1d] py-2.5 pl-14 pr-3 font-mono text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400/60"
              />
            </div>

            {/* Gateway picker */}
            <fieldset className="mt-4">
              <legend className="text-xs font-semibold text-slate-300">
                Dispatch via
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {GATEWAYS.map((g) => (
                  <label
                    key={g.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border p-2.5 transition ${
                      gateway === g.id
                        ? "border-emerald-400/60 bg-emerald-500/10"
                        : "border-panel-border bg-surface-muted/40 hover:border-emerald-400/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="test-sms-gateway"
                      value={g.id}
                      checked={gateway === g.id}
                      onChange={() => setGateway(g.id)}
                      className="h-3.5 w-3.5 shrink-0 accent-emerald-500"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-200">
                        {g.name}
                      </span>
                      <span className="block truncate text-[10px] text-slate-500">
                        {g.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Message preview */}
            <div className="mt-4 rounded-md border border-panel-border bg-[#0a0f1d] p-3">
              <p className="eoc-label text-emerald-300/70">MESSAGE PREVIEW</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                {TEST_MESSAGE}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={sending}
                className="rounded-md border border-panel-borderHover px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-surface-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || phone.length !== 10}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Dispatching…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden />
                    Send Test SMS
                  </>
                )}
              </button>
            </div>

            {sending && (
              <p className="mt-3 flex items-center gap-2 text-[11px] text-emerald-300/80">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Calling {gateway === "twilio" ? "Twilio" : "Fast2SMS"} gateway…
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
}
