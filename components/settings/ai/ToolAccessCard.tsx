"use client";

// ---------------------------------------------------------------------
// components/settings/ai/ToolAccessCard.tsx — AI Assistant (Phase 4 · Step 4).
//
// "AI Tool Access (Guardrails)" — granular agentic permission matrix:
//   • Read Flood Predictions · Query Shelter Capacity · Access Resource
//     Inventory · Read Attendance Logs · Modify User Profiles.
//   • A toggle per tool; "Modify User Profiles" is flagged high-risk with
//     a warning icon + hover tooltip.
//
// Backed by the central useAiSettings store (drip_ai_settings_v1).
// ---------------------------------------------------------------------

import {
  Bot,
  ClipboardList,
  Droplets,
  ListChecks,
  ShieldAlert,
  TriangleAlert,
  Warehouse,
  Users,
} from "lucide-react";
import { useAiSettings } from "@/lib/settings/AiSettingsContext";
import type { AiToolKey } from "@/lib/settings/ai-settings";

const TOOLS: {
  key: AiToolKey;
  label: string;
  description: string;
  icon: typeof Droplets;
  highRisk?: string;
}[] = [
  {
    key: "readFloodPredictions",
    label: "Read Flood Predictions",
    description: "Surface latest flood forecasts in briefings and alerts.",
    icon: Droplets,
  },
  {
    key: "queryShelterCapacity",
    label: "Query Shelter Capacity",
    description: "Check open-bed and free-capacity state at shelters.",
    icon: Warehouse,
  },
  {
    key: "accessResourceInventory",
    label: "Access Resource Inventory",
    description: "Look up boats, medical kits and personnel availability.",
    icon: ClipboardList,
  },
  {
    key: "readAttendanceLogs",
    label: "Read Attendance Logs",
    description: "Read responder check-in/check-out timestamps.",
    icon: ListChecks,
  },
  {
    key: "modifyUserProfiles",
    label: "Modify User Profiles",
    description: "Change responder roles, districts and permissions.",
    icon: Users,
    highRisk:
      "High Risk: Allows the AI to autonomously change responder permissions.",
  },
];

function WarningTooltip({ text }: { text: string }) {
  return (
    <span
      className="group relative inline-flex"
      role="note"
      aria-label={text}
    >
      <TriangleAlert className="h-4 w-4 cursor-help text-red-400" aria-hidden />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 w-56 rounded-md border border-red-400/40 bg-[#170f0f] p-2 text-[10px] font-medium leading-snug text-red-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export default function ToolAccessCard() {
  const { settings, update } = useAiSettings();
  const toolAccess = settings.toolAccess;

  function toggle(key: AiToolKey) {
    update({ toolAccess: { ...toolAccess, [key]: !toolAccess[key] } });
  }

  const grantedCount = TOOLS.filter((tool) => toolAccess[tool.key]).length;

  return (
    <section
      data-settings-key="ai-tool-access"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <ShieldAlert className="h-5 w-5 text-amber-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-amber-300/80">AGENTIC GUARDRAILS</p>
          <h2 className="mt-0.5 text-lg font-bold">AI Tool Access</h2>
        </div>
        <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">
          {grantedCount}/{TOOLS.length} tools
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Decide which internal systems the assistant may query or act on.
        Read-only tools are on by default; profile modification stays
        locked until you explicitly grant it.
      </p>

      {/* Permissions matrix */}
      <div className="mt-5 space-y-2.5">
        {TOOLS.map(({ key, label, description, icon: Icon, highRisk }) => {
          const on = toolAccess[key];
          return (
            <div
              key={key}
              className={`flex items-center justify-between gap-4 rounded-md border p-3 transition ${
                highRisk
                  ? on
                    ? "border-red-400/40 bg-red-500/[0.07]"
                    : "border-[#2a1a1a] bg-surface-muted/40"
                  : "border-panel-border bg-surface-muted/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                    highRisk
                      ? "bg-red-500/10"
                      : "bg-amber-500/10"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      highRisk ? "text-red-300" : "text-amber-300"
                    }`}
                    aria-hidden
                  />
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    {label}
                    <Bot
                      className="h-3.5 w-3.5 text-slate-500"
                      aria-label="AI-accessible tool"
                    />
                    {highRisk && <WarningTooltip text={highRisk} />}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {description}
                  </p>
                  {highRisk && (
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-red-300">
                      <ShieldAlert className="h-3 w-3" aria-hidden />
                      High-risk privileged action
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`${on ? "Revoke" : "Grant"} ${label}`}
                onClick={() => toggle(key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  on ? (highRisk ? "bg-red-500" : "bg-amber-500") : "bg-[#2c3f6d]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    on ? "translate-x-[22px]" : "-translate-x-[2px]"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Guardrail footnote */}
      <div className="mt-4 flex items-start gap-2 rounded-md border border-panel-border bg-[#0a0f1d] p-3">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
        <p className="text-[11px] leading-relaxed text-slate-500">
          The assistant never silently escalates. Any denied tool request is
          logged in the audit trail and surfaced as a blocking question,
          never auto-followed.
        </p>
      </div>
    </section>
  );
}
