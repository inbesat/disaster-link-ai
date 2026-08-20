"use client";

// ---------------------------------------------------------------------
// components/settings/ProfileVisibilityCard.tsx — Settings · Phase 8.
//
// Operational privacy settings card for /settings/profile:
//   • Radio-card selector for Profile Visibility across the command network:
//       - Public (Command Theater)   — all authenticated responders/NGOs.
//       - Limited (Tactical)         — name, badge & role only; contact hidden.
//       - Private (Admin Only)       — redacted from directory; district
//         magistrates only.
//   • Instant GPS toggle — "Show my live GPS status on the collaborative
//     responder map."
//
// Persistence: localStorage snapshot (offline-first, matching the rest of
// the profile settings) + a toast confirming each privacy change.
// ---------------------------------------------------------------------

import { Eye, EyeOff, Landmark, LocateFixed, Radio, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { useProfileSettings } from "@/lib/settings-mock";

type Visibility = "public" | "limited" | "private";

type VisibilityOption = {
  value: Visibility;
  icon: typeof Eye;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  radioAccent: string;
};

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: "public",
    icon: Eye,
    title: "Public",
    tagline: "Command Theater",
    description:
      "Visible to all authenticated responders and NGO members across the command network.",
    accent: "border-severity-green-500/40 bg-severity-green-500/5",
    radioAccent: "bg-severity-green-500 border-severity-green-500",
  },
  {
    value: "limited",
    icon: EyeOff,
    title: "Limited",
    tagline: "Tactical",
    description:
      "Name, Badge Number and Role visible only — personal phone / email remain hidden.",
    accent: "border-severity-amber-500/40 bg-severity-amber-500/5",
    radioAccent: "bg-severity-amber-500 border-severity-amber-500",
  },
  {
    value: "private",
    icon: Landmark,
    title: "Private",
    tagline: "Admin Only",
    description:
      "Fully redacted from the general directory — visible only to District Magistrates.",
    accent: "border-severity-red-500/40 bg-severity-red-500/5",
    radioAccent: "bg-severity-red-500 border-severity-red-500",
  },
];

const VISIBILITY_LABEL: Record<Visibility, string> = {
  public: "Command Theater",
  limited: "Tactical",
  private: "Admin Only",
};

export default function ProfileVisibilityCard() {
  // Unified mock store — visibility + GPS prefs persist and sync across tabs.
  const { settings, update } = useProfileSettings();
  const visibility: Visibility = settings.visibility;
  const shareLiveGps = settings.shareLiveGps;

  function persist(next: { visibility?: Visibility; shareLiveGps?: boolean }) {
    update({
      ...(next.visibility ? { visibility: next.visibility } : {}),
      ...(typeof next.shareLiveGps === "boolean"
        ? { shareLiveGps: next.shareLiveGps }
        : {}),
    });
  }

  function handleVisibilityChange(value: Visibility) {
    persist({ visibility: value });
    toast.success(`Profile visibility set to ${VISIBILITY_LABEL[value]}.`);
  }

  function handleGpsToggle() {
    const next = !shareLiveGps;
    persist({ shareLiveGps: next });
    toast.success(
      next
        ? "Live GPS status is now visible to your team."
        : "Live GPS status hidden from the responder map.",
    );
  }

  return (
    <section
      data-settings-key="visibility"
      className="rounded-eoc border border-panel-border bg-surface p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <ShieldAlert className="h-5 w-5 text-violet-400" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-violet-400/80">PROFILE VISIBILITY</p>
          <h2 className="mt-0.5 text-lg font-bold">Privacy &amp; Directory Access</h2>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-400">
        Choose how much of your profile other responders can see in the command
        directory and on the live map.
      </p>

      {/* Radio-card selector */}
      <div className="mt-5 grid gap-3 lg:grid-cols-3" role="radiogroup" aria-label="Profile visibility">
        {VISIBILITY_OPTIONS.map((option) => {
          const active = visibility === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleVisibilityChange(option.value)}
              className={`relative rounded-md border-2 p-4 text-left transition ${
                active ? option.accent : "border-panel-border bg-surface-muted/40 hover:border-panel-borderHover"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1c2740]">
                  <Icon className={`h-4 w-4 ${active ? "text-cyan-300" : "text-slate-400"}`} aria-hidden />
                </div>
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition ${
                    active ? option.radioAccent : "border-panel-borderHover bg-transparent"
                  }`}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white/90" />}
                </span>
              </div>

              <p className="mt-3 text-sm font-bold">
                {option.title}{" "}
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  ({option.tagline})
                </span>
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Live GPS toggle — instant switch */}
      <div className="mt-6 flex items-center justify-between gap-4 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-500/10">
            <LocateFixed className="h-4 w-4 text-cyan-300" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Show my live GPS status on the collaborative responder map
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Your map marker with a live activity indicator becomes visible to
              your district team.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={shareLiveGps}
          onClick={handleGpsToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            shareLiveGps ? "bg-cyan-500" : "bg-[#2c3f6d]"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              shareLiveGps ? "translate-x-[22px]" : "translate-x-[2px]"
            }`}
          />
        </button>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Visibility settings sync across the command center, responder directory
        and collaborative map layers.
      </p>
    </section>
  );
}