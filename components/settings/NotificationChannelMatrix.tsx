"use client";

// ---------------------------------------------------------------------
// components/settings/NotificationChannelMatrix.tsx — Settings · Phase 2 · Step 2.
//
// Multi-Channel Routing Matrix for /settings/notifications.
// A grid (alert category × delivery channel) of toggle switches:
//
//   Rows      Flood Warnings · Evacuation Orders · Resource Requests ·
//             Chat Mentions · System Updates
//   Columns   In-App · Browser Push · Email · SMS
//
// Every intersection owns its toggle. Active toggles render in the channel
// accent (cyan for in-app/push, amber for email/SMS) and clearly state
// whether they are on or off. The component is fully controlled — routes
// and thresholds come from the central useNotificationSettings store
// (Step 10), with a live "n of 20 routes" counter up top and per-channel
// "enabled x/5" chips in the legend.
// ---------------------------------------------------------------------

import { type ComponentType } from "react";
import {
  AtSign,
  Database,
  Inbox,
  Info,
  Lock,
  Mail,
  MessageSquare,
  MousePointerClick,
  Radio,
  Satellite,
  Send,
} from "lucide-react";
import {
  CATEGORY_KEYS,
  CHANNEL_KEYS,
  THRESHOLD_OPTIONS,
  countActiveRoutes,
  isThresholdLocked,
  type CategoryKey,
  type ChannelKey,
  type Routes,
  type SeverityThreshold,
  type Thresholds,
} from "@/lib/notification-routing";
import { deliveryLabel } from "@/lib/notification-digest";

type ChannelIcon = ComponentType<{ className?: string }>;

type Channel = {
  key: ChannelKey;
  label: string;
  short: string;
  icon: ChannelIcon;
  accentActive: string;
  accentDot: string;
};

type Category = {
  key: CategoryKey;
  label: string;
  icon: ChannelIcon;
  description: string;
  critical: boolean;
};

const CHANNELS: Channel[] = [
  {
    key: "in_app",
    label: "In-App",
    short: "App",
    icon: Inbox,
    accentActive: "bg-cyan-500",
    accentDot: "bg-cyan-400",
  },
  {
    key: "browser_push",
    label: "Browser Push",
    short: "Push",
    icon: MousePointerClick,
    accentActive: "bg-cyan-500",
    accentDot: "bg-cyan-400",
  },
  {
    key: "email",
    label: "Email",
    short: "Mail",
    icon: Mail,
    accentActive: "bg-amber-500",
    accentDot: "bg-amber-400",
  },
  {
    key: "sms",
    label: "SMS",
    short: "SMS",
    icon: MessageSquare,
    accentActive: "bg-amber-500",
    accentDot: "bg-amber-400",
  },
];

const CATEGORIES: Category[] = [
  {
    key: "flood_warnings",
    label: "Flood Warnings",
    icon: SirenIcon,
    description: "River-level breach, inundation extent & flood forecast alerts.",
    critical: true,
  },
  {
    key: "evacuation_orders",
    label: "Evacuation Orders",
    icon: Satellite,
    description: "Mandatory evacuation mandates & tiered response calls.",
    critical: true,
  },
  {
    key: "resource_requests",
    label: "Resource Requests",
    icon: Send,
    description: "Boats, relief material, equipment & manpower requests.",
    critical: false,
  },
  {
    key: "chat_mentions",
    label: "Chat Mentions",
    icon: AtSign,
    description: "Direct mentions & @-assignments in operational chats.",
    critical: false,
  },
  {
    key: "system_updates",
    label: "System Updates",
    icon: Database,
    description: "Platform maintenance, version notes & permission changes.",
    critical: false,
  },
];

// Icon glyph for the critical flood category tracks the EOC alert palette.
function SirenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 21v-4" />
      <path d="M3 16h18l-1.5 5a2 2 0 0 1-2 1.6H6.5a2 2 0 0 1-2-1.6L3 16Z" />
      <path d="M8 16V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v13" />
      <path d="M12 3v1" />
      <path d="M12 6h.01" />
    </svg>
  );
}

function CellToggle({
  on,
  accentActive,
  onClick,
  label,
}: {
  on: boolean;
  accentActive: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? accentActive : "bg-[#2c3f6d]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

const THRESHOLD_ACCENTS: Record<SeverityThreshold, string> = {
  critical_only: "text-red-400",
  high_and_above: "text-amber-400",
  all_alerts: "text-sky-400",
};

/** Per-row minimum-severity selector with an inline tooltip. */
function ThresholdSelect({
  categoryLabel,
  value,
  locked,
  onChange,
}: {
  categoryLabel: string;
  value: SeverityThreshold;
  locked: boolean;
  onChange: (value: SeverityThreshold) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <label
        htmlFor={`threshold-${categoryLabel}`}
        className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
      >
        Min. threshold
      </label>

      {/* Tooltip */}
      <span className="group relative inline-flex">
        <Info
          className="h-3.5 w-3.5 cursor-help text-slate-500 transition hover:text-cyan-300"
          aria-hidden
        />
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-md border border-[#2c3f6d] bg-[#131c31] px-3 py-2 text-[11px] leading-relaxed text-slate-300 shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        >
          Only alerts meeting this severity level will be routed through your
          enabled channels.
        </span>
      </span>

      <select
        id={`threshold-${categoryLabel}`}
        value={value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value as SeverityThreshold)}
        aria-label={`Minimum threshold for ${categoryLabel}`}
        className={`ml-auto rounded-md border border-[#2c3f6d] bg-surface-muted px-2 py-1 text-[11px] font-semibold outline-none transition focus:border-cyan-400 ${
          locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${THRESHOLD_ACCENTS[value]}`}
      >
        {THRESHOLD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#0a0f1d] text-slate-300">
            {option.label}
          </option>
        ))}
      </select>

      {locked && (
        <span
          title="Locked by emergency protocol — cannot be relaxed."
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400/90"
        >
          <Lock className="h-3 w-3" aria-hidden />
        </span>
      )}
    </div>
  );
}

export default function NotificationChannelMatrix({
  paused = false,
  digestEnabled = false,
  routes,
  thresholds,
  onToggleRoute,
  onChangeThreshold,
  onResetMatrix,
}: {
  paused?: boolean;
  digestEnabled?: boolean;
  routes: Routes;
  thresholds: Thresholds;
  onToggleRoute: (category: CategoryKey, channel: ChannelKey) => void;
  onChangeThreshold: (
    category: CategoryKey,
    threshold: SeverityThreshold,
  ) => void;
  onResetMatrix: () => void;
}) {
  const activeCount = countActiveRoutes(routes);

  return (
    <section
      data-settings-key="channel-matrix"
      data-paused={paused ? "true" : undefined}
      className={`rounded-eoc border border-[#1c2740] bg-surface p-5 transition-opacity ${
        paused ? "opacity-80" : ""
      }`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
            <Radio className="h-5 w-5 text-cyan-300" aria-hidden />
          </div>
          <div>
            <p className="eoc-label text-cyan-400/80">NOTIFICATION ROUTING MATRIX</p>
            <h2 className="mt-0.5 text-lg font-bold">
              Delivery channels per alert category
            </h2>
          </div>
        </div>

        <span className="rounded-md border border-[#1c2740] bg-surface-muted/60 px-3 py-1.5 text-xs font-semibold text-slate-300">
          {activeCount} of {CATEGORY_KEYS.length * CHANNEL_KEYS.length} routes enabled
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Route critical intel to the right channels. Critical alerts always break
        through regardless of this matrix; these toggles tune the noise for
        everything else.
      </p>

      {/* Table shell — scrolls horizontally on small screens */}
      <div className="mt-5 -mx-2 overflow-x-auto px-2">
        <div
          className="grid min-w-[640px] grid-cols-[minmax(180px,1.2fr)_repeat(4,minmax(112px,1fr))] rounded-md border border-[#1c2740]"
          role="grid"
          aria-label="Notification routing matrix"
        >
          {/* Column headers */}
          <div className="contents" role="row">
            <div className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Alert Category
            </div>
            {CHANNELS.map((channel) => (
              <div
                key={channel.key}
                role="columnheader"
                className="flex items-center justify-center gap-1.5 border-l border-[#1c2740] p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"
              >
                <channel.icon className="h-3.5 w-3.5" aria-hidden />
                {channel.short}
              </div>
            ))}
          </div>

          {/* One <div class="contents"> per category → turns the grid into rows */}
          {CATEGORIES.map((category, rowIndex) => {
            const Icon = category.icon;
            return (
              <div key={category.key} className="contents" role="row">
                {/* Category label cell */}
                <div
                  role="rowheader"
                  className={`flex items-center gap-3 p-3 ${
                    rowIndex > 0 ? "border-t border-[#1c2740]" : ""
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                      category.critical ? "bg-red-500/10" : "bg-slate-500/10"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        category.critical ? "text-red-400" : "text-slate-400"
                      }`}
                      aria-hidden
                    />
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold leading-tight">
                      {category.label}
                      {category.critical && (
                        <span className="rounded-sm bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                          Critical
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                      {category.description}
                    </p>
                    <ThresholdSelect
                      categoryLabel={category.label}
                      value={thresholds[category.key]}
                      locked={isThresholdLocked(category.key)}
                      onChange={(threshold) =>
                        onChangeThreshold(category.key, threshold)
                      }
                    />
                    {!category.critical && (
                      <span
                        data-delivery={deliveryLabel(
                          digestEnabled,
                          category.critical,
                        ).batched
                          ? "batched"
                          : "instant"}
                        className={`mt-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          digestEnabled
                            ? "bg-sky-500/15 text-sky-300"
                            : "bg-slate-500/10 text-slate-500"
                        }`}
                      >
                        {deliveryLabel(digestEnabled, category.critical).label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Channel toggles */}
                {CHANNELS.map((channel) => {
                  const on = routes[category.key][channel.key];
                  return (
                    <div
                      key={channel.key}
                      role="gridcell"
                      className={`flex items-center justify-center border-l border-[#1c2740] p-3 ${
                        rowIndex > 0 ? "border-t border-[#1c2740]" : ""
                      } ${on ? "bg-cyan-500/5" : "bg-transparent"}`}
                    >
                      <CellToggle
                        on={on}
                        accentActive={channel.accentActive}
                        onClick={() => onToggleRoute(category.key, channel.key)}
                        label={`${channel.label} for ${category.label}`}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend + reset */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const channelCount = CATEGORIES.filter(
              (category) => routes[category.key][channel.key],
            ).length;
            return (
              <div
                key={channel.key}
                className="flex items-center gap-2 text-xs text-slate-400"
              >
                <span className={`h-2 w-2 rounded-full ${channel.accentDot}`} />
                <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                <span>{channel.label}</span>
                <span className="text-slate-600">· {channelCount}/5 enabled</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onResetMatrix}
          className="rounded-md border border-[#2c3f6d] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300"
        >
          Reset matrix to recommended
        </button>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Routing preferences apply to your responder profile across the command
        center and field app.
      </p>
    </section>
  );
}