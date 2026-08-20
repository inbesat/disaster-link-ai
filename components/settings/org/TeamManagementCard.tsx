"use client";

// ---------------------------------------------------------------------
// components/settings/org/TeamManagementCard.tsx — Organization (Phase 5 · Step 4).
//
// Responder directory manager:
//   • Data table: Name, Email, Organization, Role dropdown.
//   • Roles: Super Admin, District Admin, Field Responder, Viewer.
//   • "Invite Responder" opens a small modal (email + role) → mock invite
//     with success toast.
//   • Red "Deactivate Account" button on every row.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Mail,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type Role = "Super Admin" | "District Admin" | "Field Responder" | "Viewer";

type Member = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: Role;
  active: boolean;
};

const ROLES: Role[] = ["Super Admin", "District Admin", "Field Responder", "Viewer"];

function deriveName(email: string): string {
  const local = email.split("@")[0] ?? "Responder";
  return local
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const INITIAL_MEMBERS: Member[] = [
  {
    id: "m1",
    name: "Anita Sharma",
    email: "anita.sharma@drip.gov.in",
    organization: "Bihar State Disaster Mgmt",
    role: "Super Admin",
    active: true,
  },
  {
    id: "m2",
    name: "Rajesh Nair",
    email: "rajesh.nair@ernakulam.nic.in",
    organization: "Ernakulam District Ops",
    role: "District Admin",
    active: true,
  },
  {
    id: "m3",
    name: "Priya Menon",
    email: "priya.menon@ndma.gov.in",
    organization: "NDMA National Ops",
    role: "Field Responder",
    active: true,
  },
  {
    id: "m4",
    name: "Karan Verma",
    email: "karan.verma@patna.gov.in",
    organization: "Patna Emergency Cell",
    role: "Field Responder",
    active: true,
  },
  {
    id: "m5",
    name: "Sara Thomas",
    email: "sara.thomas@kerala.gov.in",
    organization: "Kerala State Cell",
    role: "Viewer",
    active: false,
  },
];

type RoleStyle = {
  text: string;
  ring: string;
};

const ROLE_STYLE: Record<Role, RoleStyle> = {
  "Super Admin": { text: "text-red-300", ring: "border-red-400/50 bg-red-500/10" },
  "District Admin": { text: "text-amber-300", ring: "border-amber-400/50 bg-amber-500/10" },
  "Field Responder": { text: "text-emerald-300", ring: "border-emerald-400/50 bg-emerald-500/10" },
  Viewer: { text: "text-slate-300", ring: "border-slate-400/40 bg-slate-500/10" },
};

export default function TeamManagementCard() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Field Responder");
  const [sending, setSending] = useState(false);

  function changeRole(id: string, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    const member = members.find((m) => m.id === id);
    toast(`${member?.name ?? "Member"} reassigned to ${role}.`, { duration: 2500 });
  }

  function deactivate(id: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, active: false } : m,
      ),
    );
    const member = members.find((m) => m.id === id);
    toast(
      `${member?.name ?? "Member"}'s account deactivated — no access to ${member?.organization ?? "the platform"}.`,
      { duration: 3500 },
    );
  }

  async function sendInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === email)) {
      toast.error("That email is already on your team.");
      return;
    }
    setSending(true);
    // Mock server round-trip for the demo.
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
setMembers((prev) => [
      ...prev,
      {
        id: `invite-${Date.now()}`,
        name: deriveName(email),
        email,
        organization: "Pending",
        role: inviteRole,
        active: true,
      },
    ]);
    toast.success(`Invitation sent to ${email} as ${inviteRole}.`);
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("Field Responder");
  }

  const activeCount = members.filter((m) => m.active).length;

  return (
    <section
      data-settings-key="org-team-management"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Users className="h-5 w-5 text-amber-300" aria-hidden />
          </div>
          <div>
            <p className="eoc-label text-amber-300/80">TEAM</p>
            <h2 className="mt-0.5 text-lg font-bold">
              Team Management &amp; Role Assignment
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-500/20"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          Invite Member
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        {activeCount} of {members.length} accounts active. Assign roles to
        control access across districts, reports and the command centre.
      </p>

      {/* Role key */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <span
            key={role}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${ROLE_STYLE[role].ring} ${ROLE_STYLE[role].text}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {role}
          </span>
        ))}
      </div>

      {/* Data table */}
      <div className="mt-5 overflow-x-auto rounded-md border border-panel-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-panel-border bg-surface-muted/40 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Organization</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr
                key={member.id}
                className={`border-b border-[#152033] transition last:border-b-0 ${
                  index % 2 === 0 ? "bg-[#0a0f1d]" : "bg-surface-muted/20"
                } ${member.active ? "" : "opacity-50"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        member.active
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-[#1c2740] text-slate-500"
                      }`}
                    >
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">
                        {member.name}
                      </p>
                      {!member.active && (
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                          Deactivated
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  {member.email}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {member.organization}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={member.role}
                    onChange={(e) => changeRole(member.id, e.target.value as Role)}
                    aria-label={`Role for ${member.name}`}
                    disabled={!member.active}
                    className={`rounded-md border px-2 py-1.5 text-xs font-semibold outline-none transition focus:border-amber-400/60 ${
                      ROLE_STYLE[member.role].ring
                    } ${ROLE_STYLE[member.role].text} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role} className="bg-[#0a0f1d]">
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => deactivate(member.id)}
                    disabled={!member.active}
                    aria-label={`Deactivate ${member.name}'s account`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-400/60 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
          onClick={() => !sending && setInviteOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-eoc border border-panel-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eoc-label text-amber-300/80">INVITE</p>
                <h3 id="invite-title" className="mt-0.5 text-lg font-bold">
                  Invite a new member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                disabled={sending}
                aria-label="Close invite dialog"
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-300">
                  Email address <span className="text-red-400">*</span>
                </span>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="responder@org.gov.in"
                  className="mt-1.5 w-full rounded-md border border-panel-border bg-[#0a0f1d] px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-400/60"
                />
              </label>

              <div>
                <span className="text-xs font-semibold text-slate-300">Role</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {ROLES.map((role) => {
                    const selected = inviteRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        aria-pressed={selected}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                          selected
                            ? "border-amber-400/60 bg-amber-500/10 text-amber-200"
                            : "border-panel-border bg-[#0a0f1d] text-slate-400 hover:border-amber-400/40"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                disabled={sending}
                className="rounded-md border border-panel-border px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendInvite}
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-60"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {sending ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}