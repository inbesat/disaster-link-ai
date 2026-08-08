"use client";

// ---------------------------------------------------------------------
// components/settings/org/OrgSettingsWrapper.tsx — Organization (Phase 5 · Step 1).
//
// Tabbed admin shell for /settings/organization:
//   • Districts & Thresholds
//   • Team & Roles
//   • Operational Parameters
//   • Branding
//
// Tabs switch via local React state (no route churn) and each panel hosts
// the upcoming configuration cards. Header carries a red "Admin Only"
// badge; the dark emergency-ops theme matches the rest of settings.
// ---------------------------------------------------------------------

import { useState, type SVGProps } from "react";
import {
  Building2,
  Layers,
  MapPinned,
  Palette,
  RotateCcw,
  Users,
} from "lucide-react";
import DistrictConfigCard from "./DistrictConfigCard";
import ThresholdCalibrationCard from "./ThresholdCalibrationCard";
import TeamManagementCard from "./TeamManagementCard";
import PermissionMatrixCard from "./PermissionMatrixCard";
import OperationalParamsCard from "./OperationalParamsCard";
import ShiftScheduleCard from "./ShiftScheduleCard";
import EscalationChainCard from "./EscalationChainCard";
import BrandingCard from "./BrandingCard";
import { OrgSettingsProvider, useOrgSettings } from "@/lib/org-settings-mock";

const TABS = [
  {
    id: "districts" as const,
    label: "Districts & Thresholds",
    icon: MapPinned,
    description:
      "Define service districts, statistical hazard thresholds and zone geometry.",
  },
  {
    id: "roles" as const,
    label: "Team & Roles",
    icon: Users,
    description:
      "Manage responder teams, role definitions and access permissions.",
  },
  {
    id: "operations" as const,
    label: "Operational Parameters",
    icon: Layers,
    description:
      "Tune escalation rules, response tiers and operational defaults.",
  },
  {
    id: "branding" as const,
    label: "Branding",
    icon: Palette,
    description:
      "Organization name, logo, colour scheme and report letterhead.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function OrgSettingsWrapper() {
  return (
    <OrgSettingsProvider>
      <OrgSettingsShell />
    </OrgSettingsProvider>
  );
}

function OrgSettingsShell() {
  const [activeTab, setActiveTab] = useState<TabId>("districts");
  const { reset } = useOrgSettings();

  return (
    <div className="space-y-6" data-settings-scope="organization">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eoc-label flex items-center gap-2 text-red-400/90">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            SETTINGS / ORGANIZATION
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Organization &amp; District Management
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-red-400/50 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-300">
              <ShieldAlertIcon className="h-3 w-3" aria-hidden />
              Admin Only
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Administrative controls for districts, teams, roles, operational
            policies and your statewide identity.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#1c2740] px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-red-400/50 hover:text-red-300"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset to Defaults
        </button>
      </div>

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Organization settings sections"
        className="flex gap-1 overflow-x-auto rounded-eoc border border-[#1c2740] bg-surface-muted/40 p-1"
      >
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`org-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`org-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-red-500/15 text-red-200 shadow-inner"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active tab panel */}
      <section
        key={activeTab}
        role="tabpanel"
        id={`org-panel-${activeTab}`}
        aria-labelledby={`org-tab-${activeTab}`}
      >
        <TabIntro tab={activeTab} />
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {activeTab === "districts" ? (
            <>
              <div className="lg:col-span-2">
                <DistrictConfigCard />
              </div>
              <div className="lg:col-span-2">
                <ThresholdCalibrationCard />
              </div>
            </>
          ) : activeTab === "roles" ? (
            <>
              <div className="lg:col-span-2">
                <TeamManagementCard />
              </div>
              <div className="lg:col-span-2">
                <PermissionMatrixCard />
              </div>
            </>
          ) : activeTab === "operations" ? (
            <>
              <div className="lg:col-span-2">
                <OperationalParamsCard />
              </div>
              <div className="lg:col-span-2">
                <ShiftScheduleCard />
              </div>
              <div className="lg:col-span-2">
                <EscalationChainCard />
              </div>
            </>
          ) : activeTab === "branding" ? (
            <>
              <div className="lg:col-span-2">
                <BrandingCard />
              </div>
              <PlaceholderCard title="Upcoming card" sub="Configuration slots will appear here." icon={activeTabIcon(activeTab)} />
            </>
          ) : (
            <>
              <PlaceholderCard title="Upcoming card" sub="Configuration slots will appear here." icon={activeTabIcon(activeTab)} />
              <PlaceholderCard title="Upcoming card" sub="Configuration slots will appear here." icon={activeTabIcon(activeTab)} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ShieldAlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TabIntro({ tab }: { tab: TabId }) {
  const meta = TABS.find((t) => t.id === tab)!;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
        <meta.icon className="h-5 w-5 text-red-300" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-200">{meta.label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{meta.description}</p>
      </div>
    </div>
  );
}

function PlaceholderCard({
  title,
  sub,
  icon: Icon,
}: {
  title: string;
  sub: string;
  icon: typeof MapPinned;
}) {
  return (
    <div className="flex items-center gap-3 rounded-eoc border border-dashed border-[#1c2740] bg-surface-muted/40 p-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
        <Icon className="h-4 w-4 text-slate-500" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-400">{title}</p>
        <p className="mt-0.5 text-xs text-slate-600">{sub}</p>
      </div>
    </div>
  );
}

function activeTabIcon(tab: TabId): typeof MapPinned {
  const meta = TABS.find((t) => t.id === tab)!;
  return meta.icon;
}