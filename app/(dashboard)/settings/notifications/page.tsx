"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/notifications/page.tsx — UI/UX Phase 7 · Step 4.
//
// Notification preferences grouped into category cards (Flood Alerts,
// Evacuation, Resources & Logistics, System). Each card carries an icon,
// title, a master toggle and a 4-channel matrix (In-App / Push / Email /
// SMS) rendered as rows of switches.
// ---------------------------------------------------------------------

import { useState } from "react";
import { Bell, Check, Package, ServerCog, TriangleAlert, Waves } from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import Toggle from "@/components/settings/Toggle";
import { showToast } from "@/components/ui/Toast";

const CHANNELS = ["In-App", "Push", "Email", "SMS"] as const;
type Channel = (typeof CHANNELS)[number];

type Category = {
  id: string;
  title: string;
  description: string;
  icon: typeof Waves;
  defaultEnabled: boolean;
  defaultChannels: Channel[];
};

const CATEGORIES: Category[] = [
  {
    id: "flood",
    title: "Flood Alerts",
    description: "Water level breaches, GLOFAS forecasts and riverine warnings.",
    icon: Waves,
    defaultEnabled: true,
    defaultChannels: ["In-App", "Push", "SMS"],
  },
  {
    id: "evac",
    title: "Evacuation Orders",
    description: "Evacuation orders, shelter openings and route closures.",
    icon: TriangleAlert,
    defaultEnabled: true,
    defaultChannels: ["In-App", "Push", "Email", "SMS"],
  },
  {
    id: "resources",
    title: "Resource Updates",
    description: "Boat, ambulance, and supply dispatch confirmations.",
    icon: Package,
    defaultEnabled: false,
    defaultChannels: ["In-App"],
  },
  {
    id: "system",
    title: "System Status",
    description: "Security events, data sync and maintenance windows.",
    icon: ServerCog,
    defaultEnabled: true,
    defaultChannels: ["In-App", "Email"],
  },
];

export default function NotificationsSettingsPage() {
  const [categories, setCategories] = useState<
    Record<string, { enabled: boolean; channels: Channel[] }>
  >(() =>
    Object.fromEntries(
      CATEGORIES.map((c) => [
        c.id,
        { enabled: c.defaultEnabled, channels: [...c.defaultChannels] },
      ]),
    ),
  );
  const [quietHours, setQuietHours] = useState(true);
  const [quietFrom, setQuietFrom] = useState("22:00");
  const [quietTo, setQuietTo] = useState("06:00");

  const setCategory = (
    id: string,
    patch: Partial<{ enabled: boolean; channels: Channel[] }>,
  ) => {
    setCategories((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const toggleChannel = (id: string, channel: Channel) => {
    setCategories((prev) => {
      const cur = prev[id];
      const has = cur.channels.includes(channel);
      return {
        ...prev,
        [id]: {
          ...cur,
          channels: has
            ? cur.channels.filter((c) => c !== channel)
            : [...cur.channels, channel],
        },
      };
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title="Notification Preferences"
        description="Pick which channels reach your phone, radio and inbox during an incident."
        icon={Bell}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {CATEGORIES.map((category) => {
            const state = categories[category.id];
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className={`rounded-xl border p-4 transition ${
                  state.enabled
                    ? "border-border bg-secondary"
                    : "border-border/60 bg-secondary/40 opacity-80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-primary">{category.title}</p>
                    <p className="text-xs text-muted">{category.description}</p>
                  </div>
                  <Toggle
                    checked={state.enabled}
                    onChange={(v) => setCategory(category.id, { enabled: v })}
                    label={`${category.title} enabled`}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-subtle pt-3">
                  {CHANNELS.map((channel) => {
                    const active = state.channels.includes(channel);
                    return (
                      <button
                        key={channel}
                        type="button"
                        role="checkbox"
                        aria-checked={active}
                        disabled={!state.enabled}
                        onClick={() => toggleChannel(category.id, channel)}
                        className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-medium transition ${
                          active
                            ? "border-accent/60 bg-accent/10 text-accent"
                            : "border-border bg-[var(--bg-tertiary)]/50 text-slate-300 hover:border-accent/40"
                        } disabled:cursor-not-allowed disabled:opacity-45`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                            active
                              ? "border-accent bg-accent text-slate-950"
                              : "border-border bg-tertiary"
                          }`}
                        >
                          {active && (
                            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                          )}
                        </span>
                        {channel}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Quiet Hours"
        description="Suppress non-critical pings overnight so responders can actually rest."
        icon={Bell}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-300">Enable quiet hours</span>
            <Toggle checked={quietHours} onChange={setQuietHours} label="Quiet hours" />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              From
            </span>
            <input
              type="time"
              value={quietFrom}
              onChange={(e) => setQuietFrom(e.target.value)}
              disabled={!quietHours}
              className="rounded-md border border-subtle bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent disabled:opacity-40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              To
            </span>
            <input
              type="time"
              value={quietTo}
              onChange={(e) => setQuietTo(e.target.value)}
              disabled={!quietHours}
              className="rounded-md border border-subtle bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent disabled:opacity-40"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              showToast("success", {
                title: "Preferences saved",
                description: "Channel matrix updated.",
              })
            }
            className="ml-auto rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-accent/85"
          >
            Save Preferences
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
