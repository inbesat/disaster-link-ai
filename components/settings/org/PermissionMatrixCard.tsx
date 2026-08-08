"use client";

// ---------------------------------------------------------------------
// components/settings/org/PermissionMatrixCard.tsx — Organization (Phase 5 · Step 5).
//
// Granular role-permission security grid. Roles are columns, actions are
// rows. Super Admin is locked (all on, disabled); other roles can be toggled
// freely. Changes are local component state with a toast summary.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import { Lock, ShieldCheck } from "lucide-react";

type RoleKey = "superAdmin" | "districtAdmin" | "fieldResponder" | "viewer";

const ROLES: { key: RoleKey; label: string }[] = [
  { key: "superAdmin", label: "Super Admin" },
  { key: "districtAdmin", label: "District Admin" },
  { key: "fieldResponder", label: "Field Responder" },
  { key: "viewer", label: "Viewer" },
];

const ACTIONS = [
  { key: "viewMap", label: "View Map" },
  { key: "editShelters", label: "Edit Shelters" },
  { key: "manageResources", label: "Manage Resources" },
  { key: "sendAlerts", label: "Send Alerts" },
  { key: "runAiPlans", label: "Run AI Plans" },
  { key: "exportData", label: "Export Data" },
] as const;

type ActionKey = (typeof ACTIONS)[number]["key"];

// Baseline matrix. Super Admin holds every capability; Viewer is read-only.
const DEFAULT_MATRIX: Record<ActionKey, Record<RoleKey, boolean>> = {
  viewMap: {
    superAdmin: true,
    districtAdmin: true,
    fieldResponder: true,
    viewer: true,
  },
  editShelters: {
    superAdmin: true,
    districtAdmin: true,
    fieldResponder: false,
    viewer: false,
  },
  manageResources: {
    superAdmin: true,
    districtAdmin: true,
    fieldResponder: false,
    viewer: false,
  },
  sendAlerts: {
    superAdmin: true,
    districtAdmin: true,
    fieldResponder: false,
    viewer: false,
  },
  runAiPlans: {
    superAdmin: true,
    districtAdmin: true,
    fieldResponder: true,
    viewer: false,
  },
  exportData: {
    superAdmin: true,
    districtAdmin: true,
    fieldResponder: false,
    viewer: true,
  },
};

const CELL_LOCKED: Record<RoleKey, boolean> = {
  superAdmin: true,
  districtAdmin: false,
  fieldResponder: false,
  viewer: false,
};

export default function PermissionMatrixCard() {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);

  function toggle(action: ActionKey, role: RoleKey) {
    if (CELL_LOCKED[role]) return;
    setMatrix((prev) => ({
      ...prev,
      [action]: { ...prev[action], [role]: !prev[action][role] },
    }));
  }

  function roleCount(role: RoleKey): number {
    return ACTIONS.filter((a) => matrix[a.key][role]).length;
  }

  return (
    <section
      data-settings-key="org-permission-matrix"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <ShieldCheck className="h-5 w-5 text-blue-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-blue-300/80">SECURITY</p>
          <h2 className="mt-0.5 text-lg font-bold">Role Permission Matrix</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Every role-capability intersection is a permission.{" "}
        <span className="inline-flex items-center gap-1 font-semibold text-blue-300">
          <Lock className="h-3 w-3" aria-hidden /> Super Admin
        </span>{" "}
        is locked with full access; toggle the other roles to customise the
        platform per team.
      </p>

      <div className="mt-5 overflow-x-auto rounded-md border border-[#1c2740]">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#1c2740] bg-surface-muted/40">
              <th
                scope="col"
                className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500"
              >
                Action
              </th>
              {ROLES.map((role) => (
                <th
                  key={role.key}
                  scope="col"
                  className={`px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest ${
                    role.key === "superAdmin"
                      ? "text-blue-300"
                      : "text-slate-400"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {role.key === "superAdmin" && (
                      <Lock className="h-3 w-3" aria-hidden />
                    )}
                    {role.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map((row, index) => (
              <tr
                key={row.key}
                className={`border-b border-[#152033] transition last:border-b-0 ${
                  index % 2 === 0 ? "bg-[#0a0f1d]" : "bg-surface-muted/20"
                }`}
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-200">
                    {row.label}
                  </p>
                </td>
                {ROLES.map((role) => {
                  const locked = CELL_LOCKED[role.key];
                  const checked = matrix[row.key][role.key];
                  return (
                    <td key={role.key} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked}
                        onChange={() => toggle(row.key, role.key)}
                        aria-label={`${role.label}: ${row.label}`}
                        className={`h-4 w-4 cursor-pointer accent-blue-500 disabled:cursor-not-allowed ${
                          checked
                            ? "opacity-100"
                            : locked
                              ? "opacity-0"
                              : "opacity-60"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#1c2740] bg-surface-muted/30">
              <td className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Granted count
              </td>
              {ROLES.map((role) => (
                <td
                  key={role.key}
                  className={`px-3 py-2.5 text-center text-xs font-bold ${
                    role.key === "superAdmin" ? "text-blue-300" : "text-slate-400"
                  }`}
                >
                  {roleCount(role.key)}/{ACTIONS.length}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          Changes are applied instantly and effect team access across the
          platform demo.
        </p>
        <button
          type="button"
          onClick={() => {
            setMatrix(DEFAULT_MATRIX);
            toast("Permission matrix reset to default.", { duration: 2500 });
          }}
          className="rounded-md border border-[#1c2740] px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-blue-400/50 hover:text-blue-200"
        >
          Reset to Defaults
        </button>
      </div>
    </section>
  );
}