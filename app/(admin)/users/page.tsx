"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, ChevronDown, UserX, RotateCw } from "lucide-react";
import { ROLES, type Role } from "@/lib/validations/user";
import {
  changeUserRole,
  deactivateUser,
  listUsers,
  reactivateUser,
  type AdminUser,
} from "@/app/actions/admin";
import ExportDataButton from "@/components/admin/ExportDataButton";

const ROLE_STYLES: Record<Role, string> = {
  super_admin: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  district_admin: "bg-accent/15 text-accent border-accent/30",
  field_responder: "bg-severity-amber-500/15 text-severity-amber-300 border-severity-amber-500/30",
  viewer: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(normalized) ||
          u.organization.toLowerCase().includes(normalized) ||
          u.assignedDistrict.toLowerCase().includes(normalized),
      )
    : users;

  async function handleRoleChange(id: string, role: Role) {
    const next = await changeUserRole(id, role);
    setUsers(next);
    toast.success("Role updated");
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            Promote, reassign, or deactivate responder accounts.
          </p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, org, or district…"
            className="w-full rounded-md border border-border bg-surface-elevated py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-500 focus:border-amber-400/60"
          />
        </div>

        <ExportDataButton
          data={filtered}
          filename="drip-users-export"
          label="Export CSV"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#1c2740] bg-[#0b1120]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#1c2740] text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">District</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Last Active</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151d31]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Loading users…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No matching users.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="transition hover:bg-[#131b30]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a2740] text-xs font-semibold text-amber-300">
                          {u.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div className="leading-tight">
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.organization}</td>
                    <td className="px-4 py-3 text-slate-300">{u.assignedDistrict}</td>
                    <td className="px-4 py-3">
                      <RoleSelect user={u} onChange={handleRoleChange} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                          u.status === "active"
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-red-500/30 bg-red-500/15 text-red-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.status === "active" ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.lastActive}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const next =
                            u.status === "active"
                              ? deactivateUser(u.id)
                              : reactivateUser(u.id);
                          void next.then(setUsers);
                          toast.success(
                            u.status === "active"
                              ? "Account deactivated"
                              : "Account reactivated",
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                          u.status === "active"
                            ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        {u.status === "active" ? (
                          <>
                            <UserX className="h-3.5 w-3.5" /> Deactivate
                          </>
                        ) : (
                          <>
                            <RotateCw className="h-3.5 w-3.5" /> Reactivate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Demo data shown via a mock server action. Role changes and deactivations update in-memory and reset on restart.
      </p>
    </div>
  );
}

function RoleSelect({
  user,
  onChange,
}: {
  user: AdminUser;
  onChange: (id: string, role: Role) => void;
}) {
  return (
    <div className="relative inline-block">
      <select
        value={user.role}
        onChange={(e) => onChange(user.id, e.target.value as Role)}
        aria-label={`Change role for ${user.name}`}
        className={`appearance-none rounded-md border bg-surface-elevated px-3 py-1.5 pr-8 text-xs font-medium outline-none transition focus:border-amber-400/60 ${ROLE_STYLES[user.role]}`}
      >
        {ROLES.map((role) => (
          <option key={role} value={role} className="bg-surface-elevated text-foreground">
            {role.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-current opacity-70" />
    </div>
  );
}
