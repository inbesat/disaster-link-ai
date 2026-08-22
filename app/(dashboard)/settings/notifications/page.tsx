"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/notifications/page.tsx — UI/UX Phase 14 · Step 4.
//
// Notification preferences grouped into category cards (Flood Alerts,
// Evacuation, Resource Requests, System Updates). Each card carries an icon,
// title, a master toggle and a 4-channel matrix (In-App / Push / Email /
// SMS) rendered as rows of switches.
//   • Public: Quiet Hours (10PM-6AM, critical overrides toggle)
//   • Gov: Alert Radius slider, Digest Mode toggle, Test Notifications
// ---------------------------------------------------------------------

import { useState } from "react";
import {
  Bell,
  Check,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  ServerCog,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  Waves,
} from "lucide-react";
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
    title: "Resource Requests",
    description: "Boat, ambulance, and supply dispatch confirmations.",
    icon: Package,
    defaultEnabled: false,
    defaultChannels: ["In-App"],
  },
  {
    id: "system",
    title: "System Updates",
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

  // Quiet Hours
  const [quietHours, setQuietHours] = useState(true);
  const [quietFrom, setQuietFrom] = useState("22:00");
  const [quietTo, setQuietTo] = useState("06:00");
  const [overrideCritical, setOverrideCritical] = useState(true);

  // Gov-only: Alert Radius, Digest, Test
  const [alertRadius, setAlertRadius] = useState(50);
  const [digestMode, setDigestMode] = useState(false);
  const [testChannel, setTestChannel] = useState<string | null>(null);

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

  const sendTest = (channel: string) => {
    setTestChannel(channel);
    setTimeout(() => {
      setTestChannel(null);
      showToast("success", {
        title: "Test sent",
        description: `Test notification sent via ${channel}.`,
      });
    }, 1500);
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
                    ? "border-white/10 bg-white/5"
                    : "border-white/10 bg-white/[0.02] opacity-80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-400/10 text-purple-400">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-200">{category.title}</p>
                    <p className="text-xs text-slate-500">{category.description}</p>
                  </div>
                  <Toggle
                    checked={state.enabled}
                    onChange={(v) => setCategory(category.id, { enabled: v })}
                    label={`${category.title} enabled`}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
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
                            ? "border-purple-400/60 bg-purple-400/10 text-purple-300"
                            : "border-white/10 bg-white/5 text-slate-400 hover:border-purple-400/40"
                        } disabled:cursor-not-allowed disabled:opacity-45`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                            active
                              ? "border-purple-400 bg-purple-400 text-slate-950"
                              : "border-white/10 bg-white/5"
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

      {/* Quiet Hours (Public + Gov) */}
      <SettingsSection
        title="Quiet Hours"
        description="Suppress non-critical pings overnight so responders can actually rest."
        icon={Clock}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-300">Enable quiet hours</span>
              <Toggle checked={quietHours} onChange={setQuietHours} label="Quiet hours" />
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">From</span>
              <input
                type="time"
                value={quietFrom}
                onChange={(e) => setQuietFrom(e.target.value)}
                disabled={!quietHours}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-purple-400 disabled:opacity-40"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">To</span>
              <input
                type="time"
                value={quietTo}
                onChange={(e) => setQuietTo(e.target.value)}
                disabled={!quietHours}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-purple-400 disabled:opacity-40"
              />
            </label>
          </div>

          {/* Critical Override */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-200">Override for critical alerts</p>
              <p className="text-[11px] text-slate-500">Flood and evacuation alerts break through quiet hours.</p>
            </div>
            <Toggle
              checked={overrideCritical}
              onChange={setOverrideCritical}
              label="Override quiet hours for critical"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              showToast("success", {
                title: "Preferences saved",
                description: "Quiet hours updated.",
              })
            }
            className="rounded-lg bg-purple-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple-400 active:scale-[0.98]"
          >
            Save Preferences
          </button>
        </div>
      </SettingsSection>

      {/* Alert Radius (Gov-only) */}
      <SettingsSection
        title="Alert Radius"
        description="How far from your district you want to receive alerts."
        icon={MapPin}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Radius</span>
              <span className="text-sm font-mono font-bold text-purple-300">{alertRadius} km</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={alertRadius}
              onChange={(e) => setAlertRadius(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>10 km</span>
              <span>50 km</span>
              <span>100 km</span>
              <span>200 km</span>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Digest Mode (Gov-only) */}
      <SettingsSection
        title="Digest Mode"
        description="Bundle non-critical alerts into a daily digest instead of real-time pushes."
        icon={Mail}
      >
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-200">Enable daily digest</p>
            <p className="text-[11px] text-slate-500">Non-urgent alerts are bundled and delivered at 8:00 AM.</p>
          </div>
          <Toggle checked={digestMode} onChange={setDigestMode} label="Digest mode" />
        </div>
      </SettingsSection>

      {/* Test Notifications */}
      <SettingsSection
        title="Test Notifications"
        description="Send a test notification to verify your channels are working."
        icon={ShieldCheck}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "In-App", icon: Smartphone },
            { label: "Push", icon: Bell },
            { label: "Email", icon: Mail },
            { label: "SMS", icon: MessageSquare },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => sendTest(label)}
              disabled={testChannel !== null}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-purple-400/40 hover:bg-purple-400/10 hover:text-purple-300 disabled:opacity-50"
            >
              {testChannel === label ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
              ) : (
                <Icon className="h-4 w-4" aria-hidden />
              )}
              {testChannel === label ? "Sending..." : `Test ${label}`}
            </button>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
