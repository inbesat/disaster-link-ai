"use client";

// ---------------------------------------------------------------------
// components/dashboard/AlertFeedWidget.tsx — UI/UX Phase 4 · Step 5.
//
// Vertical "Active Alerts" feed sitting beside the live map (1×2 grid
// cell). Renders a scrollable list of recent mock alerts using DataRow:
//   [severity icon]  title / message preview   •  "2m ago"
// Cleaner Monochrome: severity is ALSO conveyed by a colored dot so the
// feed never relies on icon shape alone.
// ---------------------------------------------------------------------

import Link from "next/link";
import { Flame, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import Panel from "@/components/ui/Panel";
import DataRow from "@/components/ui/DataRow";

type MockAlert = {
  id: string;
  icon: LucideIcon;
  severity: "critical" | "warning" | "watch";
  title: string;
  message: string;
  time: string;
  /** Color dot — severity colour + pulse on the hottest tier. */
  dotClass: string;
};

const MOCK_ALERTS: MockAlert[] = [
  {
    id: "a1",
    icon: OctagonAlert,
    severity: "critical",
    title: "Sector 4 — Riverine Breach",
    message: "Water level 0.5 m above danger mark; evacuate 12 blocks",
    time: "2m ago",
    dotClass: "bg-accent-danger animate-pulse",
  },
  {
    id: "a2",
    icon: TriangleAlert,
    severity: "warning",
    title: "Daulatpur Bridge Access",
    message: "Approach road submerged — 4 bus routes rerouted",
    time: "11m ago",
    dotClass: "bg-accent-warning",
  },
  {
    id: "a3",
    icon: TriangleAlert,
    severity: "warning",
    title: "Khagaul Power Substation",
    message: "Inundation risk — portable gensets require refuel",
    time: "32m ago",
    dotClass: "bg-accent-warning",
  },
  {
    id: "a4",
    icon: Flame,
    severity: "watch",
    title: "Sarvadeep Shelter Area",
    message: "Occupancy at 87% — 40 cots short before nightfall",
    time: "1h ago",
    dotClass: "bg-slate-400",
  },
  {
    id: "a5",
    icon: OctagonAlert,
    severity: "critical",
    title: "Chandpura Low-Lying Ward",
    message: "650 households unreachable — boat ferry required",
    time: "2h ago",
    dotClass: "bg-accent-danger",
  },
];

export function AlertFeedWidget() {
  return (
    <Panel
      className=""
      bodyClassName="max-h-[400px] overflow-y-auto p-1.5"
      title={
        <>
          <span>Active Alerts</span>
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-danger/15 px-1.5 text-[10px] font-bold tabular-nums text-accent-danger">
            {MOCK_ALERTS.length}
          </span>
        </>
      }
      action={
        <Link
          href="/alerts"
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
        >
          View All
        </Link>
      }
    >
      <ul className="flex flex-col gap-1">
        {MOCK_ALERTS.map((alert) => (
          <li key={alert.id}>
            <DataRow
              icon={alert.icon}
              title={alert.title}
              subtitle={alert.message}
              trailingElement={
                <span className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${alert.dotClass}`}
                    aria-hidden
                  />
                  <span className="text-xs tabular-nums text-muted">{alert.time}</span>
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default AlertFeedWidget;
