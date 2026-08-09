"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/admin/page.tsx — UI/UX Phase 7 · Step 10.
//
// Admin Panel — deliberately distinct from regular settings: a dense,
// data-first table with a filter bar, per-row action dropdowns and bulk
// operation buttons. The darker header (bg-[#020617]) signals elevated
// privileges.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  CheckSquare,
  ChevronDown,
  Download,
  MoreVertical,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import { initialsFor } from "@/lib/settings/avatar";
import { showToast } from "@/components/ui/Toast";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Incident Commander" | "Responder" | "Viewer";
  district: string;
  status: "Active" | "Standby" | "Disabled";
  lastActive: string;
};

const INITIAL_ROWS: UserRow[] = [
  {
    id: "u1",
    name: "Aarav Sharma",
    email: "aarav.sharma@drp.gov.in",
    role: "Super Admin",
    district: "Patna",
    status: "Active",
    lastActive: "2m ago",
  },
  {
    id: "u2",
    name: "Priya Nair",
    email: "priya.nair@drp.gov.in",
    role: "Incident Commander",
    district: "Patna",
    status: "Active",
    lastActive: "11m ago",
  },
  {
    id: "u3",
    name: "Ravi Kumar",
    email: "ravi.kumar@drp.gov.in",
    role: "Admin",
    district: "Purba Champaran",
    status: "Active",
    lastActive: "1h ago",
  },
  {
    id: "u4",
    name: "Sana Iqbal",
    email: "sana.iqbal@drp.gov.in",
    role: "Responder",
    district: "Ernakulam",
    status: "Standby",
    lastActive: "3h ago",
  },
  {
    id: "u5",
    name: "Dev Patel",
    email: "dev.patel@drp.gov.in",
    role: "Responder",
    district: "Patna",
    status: "Disabled",
    lastActive: "4d ago",
  },
  {
    id: "u6",
    name: "Meera Joshi",
    email: "meera.joshi@drp.gov.in",
    role: "Viewer",
    district: "Purba Champaran",
    status: "Active",
    lastActive: "2d ago",
  },
  {
    id: "u7",
    name: "Vikram Rao",
    email: "vikram.rao@drp.gov.in",
    role: "Responder",
    district: "Ernakulam",
    status: "Standby",
    lastActive: "5h ago",
  },
];

const STATUS_STYLE: Record<UserRow["status"], string> = {
  Active: "text-accent-success bg-accent-success/10 border-accent-success/40",
  Standby: "text-accent-warning bg-accent-warning/10 border-accent-warning/40",
  Disabled: "text-muted bg-tertiary border-border",
};

export default function AdminPanelPage() {
  const [rows, setRows] = useState<UserRow[]>(INITIAL_ROWS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserRow["status"]>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRow["role"]>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const filtered = rows.filter((r) => {
    const q = query.toLowerCase();
    const matchQ = `${r.name} ${r.email} ${r.district}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchRole = roleFilter === "all" || r.role === roleFilter;
    return matchQ && matchStatus && matchRole;
  });

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDelete = () => {
    setRows((prev) => prev.filter((r) => !selected.has(r.id)));
    showToast("error", {
      title: `${selected.size} account(s) disabled`,
      description: "Removed from the active roster.",
    });
    setSelected(new Set());
  };

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  return (
    <div className="flex flex-col gap-6">
      {/* Elevated-privilege header */}
      <div className="-mx-4 -mt-4 rounded-b-xl border-b border-subtle bg-[#020617] px-6 py-5 sm:-mx-6 sm:px-8 sm:-mt-6 lg:-mx-8 lg:px-8 lg:-mt-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent-danger/40 bg-accent-danger/10 text-accent-danger">
              <ShieldAlert className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="flex items-center gap-2 text-xl font-bold text-primary">
                Admin Panel
                <span className="rounded border border-accent-danger/40 bg-accent-danger/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-accent-danger">
                  Elevated Access
                </span>
              </p>
              <p className="text-xs text-slate-500">
                User roster, permissions and platform operations.
              </p>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-mono text-xl font-bold text-slate-100">{rows.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Active operators
            </p>
          </div>
        </div>
      </div>

      <SettingsSection
        title="User Roster"
        description="Manage operator accounts and standing roles."
        icon={ShieldAlert}
      >
        {/* Filter bar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or district…"
              aria-label="Search users"
              className="w-full rounded-md border border-border bg-[var(--bg-tertiary)] py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-muted focus:border-accent"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserRow["status"])}
            aria-label="Filter by status"
            className="rounded-md border border-border bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Standby">Standby</option>
            <option value="Disabled">Disabled</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRow["role"])}
            aria-label="Filter by role"
            className="rounded-md border border-border bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent"
          >
            <option value="all">All roles</option>
            <option>Super Admin</option>
            <option>Admin</option>
            <option>Incident Commander</option>
            <option>Responder</option>
            <option>Viewer</option>
          </select>
        </div>

        {/* Bulk operations */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <CheckSquare className="h-3.5 w-3.5 text-accent" aria-hidden />
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() =>
                showToast("success", {
                  title: "Bulk approved",
                  description: `${selected.size} accounts re-verified.`,
                })
              }
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Bulk Approve
            </button>
            <button
              type="button"
              onClick={() =>
                showToast("info", {
                  title: "Export queued",
                  description: "Roster will be emailed as CSV.",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-accent hover:text-accent"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={bulkDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-accent-danger/40 bg-accent-danger/10 px-3 py-1.5 text-xs font-semibold text-accent-danger transition hover:bg-accent-danger/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Disable Selected
            </button>
          </div>
        </div>

        {/* Dense table */}
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] border-collapse text-xs">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
                <th className="border-b border-subtle px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allChecked}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelected(new Set(filtered.map((r) => r.id)));
                      else setSelected(new Set());
                    }}
                    className="h-3.5 w-3.5 accent-[var(--accent-primary)]"
                  />
                </th>
                <th className="border-b border-subtle px-3 py-2.5 font-semibold">User</th>
                <th className="border-b border-subtle px-3 py-2.5 font-semibold">Role</th>
                <th className="border-b border-subtle px-3 py-2.5 font-semibold">
                  District
                </th>
                <th className="border-b border-subtle px-3 py-2.5 font-semibold">
                  Status
                </th>
                <th className="border-b border-subtle px-3 py-2.5 font-semibold">
                  Last active
                </th>
                <th className="border-b border-subtle px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-secondary">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--bg-tertiary)]/40">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.name}`}
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="h-3.5 w-3.5 accent-[var(--accent-primary)]"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-[var(--bg-tertiary)] text-[10px] font-bold text-slate-300">
                        {initialsFor(row.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-100">
                          {row.name}
                        </p>
                        <p className="truncate font-mono text-[10px] text-muted">
                          {row.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300">{row.role}</td>
                  <td className="px-3 py-2.5 text-slate-400">{row.district}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLE[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-muted">
                    {row.lastActive}
                  </td>
                  <td className="relative px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}
                      aria-label={`Actions for ${row.name}`}
                      className="rounded-md p-1.5 text-muted transition hover:bg-tertiary hover:text-slate-200"
                    >
                      <MoreVertical className="h-4 w-4" aria-hidden />
                    </button>
                    {openMenu === row.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-3 top-9 z-20 w-40 rounded-lg border border-border bg-[var(--bg-tertiary)] py-1 text-left shadow-xl"
                      >
                        {[
                          "View profile",
                          "Edit role",
                          row.status === "Disabled" ? "Re-enable" : "Disable",
                        ].map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => {
                              setOpenMenu(null);
                              showToast("info", {
                                title: action,
                                description: `${row.name} · ${row.email}`,
                              });
                            }}
                            className="block w-full px-3 py-2 text-xs text-slate-200 transition hover:bg-secondary"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-xs text-muted">
                    No operators match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <ChevronDown className="h-3 w-3 rotate-90" aria-hidden />
          Showing {filtered.length} of {rows.length} operators · changes are audit-logged.
        </p>
      </SettingsSection>
    </div>
  );
}
