"use client";

// ---------------------------------------------------------------------
// components/gov/team/TeamRoster.tsx — Team Roster View.
//
// Grid/table hybrid showing responder cards with:
//   • Avatar (40px), name, role badge
//   • Current location (live GPS dot + name)
//   • Status (online/on duty/off duty — colored dot)
//   • Assigned task
//   • Contact buttons (call/message)
//   • Filter by role, status, location
//   • Sort by name or status
//   • "Add Team Member" button
// ---------------------------------------------------------------------

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Filter,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  SortAsc,
  SortDesc,
  User,
  Users,
  XCircle,
} from "lucide-react";

export type ResponderStatus = "online" | "on-duty" | "off-duty";

export type Responder = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  location: string;
  status: ResponderStatus;
  assignedTask: string;
  phone: string;
  email: string;
};

const STATUS_CONFIG: Record<
  ResponderStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  online: {
    label: "Online",
    dot: "bg-emerald-400",
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
  },
  "on-duty": {
    label: "On Duty",
    dot: "bg-amber-400",
    bg: "bg-amber-400/10",
    text: "text-amber-400",
  },
  "off-duty": {
    label: "Off Duty",
    dot: "bg-slate-500",
    bg: "bg-slate-500/10",
    text: "text-slate-500",
  },
};

const ROLE_COLORS: Record<string, string> = {
  "Team Lead": "border-blue-400/40 bg-blue-400/10 text-blue-400",
  Medic: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  Responder: "border-purple-400/40 bg-purple-400/10 text-purple-400",
  Coordinator: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  Driver: "border-slate-400/40 bg-slate-400/10 text-slate-400",
  Analyst: "border-cyan-400/40 bg-cyan-400/10 text-cyan-400",
};

const MOCK_RESPONDERS: Responder[] = [
  {
    id: "r1",
    name: "Amit Kumar",
    role: "Team Lead",
    avatar: "AK",
    location: "Punpun Ghat",
    status: "online",
    assignedTask: "Evacuation Zone A",
    phone: "+91 98765 43210",
    email: "amit.kumar@district.gov.in",
  },
  {
    id: "r2",
    name: "Priya Singh",
    role: "Medic",
    avatar: "PS",
    location: "Rampur High School",
    status: "on-duty",
    assignedTask: "Medical Station Alpha",
    phone: "+91 98765 43211",
    email: "priya.singh@health.gov.in",
  },
  {
    id: "r3",
    name: "Rajesh Verma",
    role: "Responder",
    avatar: "RV",
    location: "NH-01 Staging",
    status: "online",
    assignedTask: "Boat Deployment Team",
    phone: "+91 98765 43212",
    email: "rajesh.verma@ndrf.gov.in",
  },
  {
    id: "r4",
    name: "Sunita Devi",
    role: "Coordinator",
    avatar: "SD",
    location: "District HQ",
    status: "online",
    assignedTask: "Resource Allocation",
    phone: "+91 98765 43213",
    email: "sunita.devi@district.gov.in",
  },
  {
    id: "r5",
    name: "Mohammad Khan",
    role: "Driver",
    avatar: "MK",
    location: "Sadar Bus Depot",
    status: "on-duty",
    assignedTask: "Evacuation Transport",
    phone: "+91 98765 43214",
    email: "mohammad.khan@transport.gov.in",
  },
  {
    id: "r6",
    name: "Anita Patel",
    role: "Analyst",
    avatar: "AP",
    location: "District HQ",
    status: "online",
    assignedTask: "Flood Monitoring",
    phone: "+91 98765 43215",
    email: "anita.patel@district.gov.in",
  },
  {
    id: "r7",
    name: "Vikram Singh",
    role: "Responder",
    avatar: "VS",
    location: "Daulatpur Camp",
    status: "off-duty",
    assignedTask: "—",
    phone: "+91 98765 43216",
    email: "vikram.singh@ndrf.gov.in",
  },
  {
    id: "r8",
    name: "Neha Gupta",
    role: "Medic",
    avatar: "NG",
    location: "Community Hall",
    status: "on-duty",
    assignedTask: "Shelter Medical Post",
    phone: "+91 98765 43217",
    email: "neha.gupta@health.gov.in",
  },
];

type SortField = "name" | "status";

const STATUS_ORDER: Record<ResponderStatus, number> = {
  online: 0,
  "on-duty": 1,
  "off-duty": 2,
};

export function TeamRoster() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState<ResponderStatus | "">("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const roles = useMemo(
    () => Array.from(new Set(MOCK_RESPONDERS.map((r) => r.role))).sort(),
    [],
  );
  const locations = useMemo(
    () => Array.from(new Set(MOCK_RESPONDERS.map((r) => r.location))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    let result = MOCK_RESPONDERS.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterRole && r.role !== filterRole) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterLocation && r.location !== filterLocation) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortField === "status") {
        const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        return sortAsc ? diff : -diff;
      }
      const diff = a.name.localeCompare(b.name);
      return sortAsc ? diff : -diff;
    });

    return result;
  }, [search, filterRole, filterStatus, filterLocation, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const onlineCount = MOCK_RESPONDERS.filter((r) => r.status === "online").length;
  const onDutyCount = MOCK_RESPONDERS.filter((r) => r.status === "on-duty").length;

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0a0f1a]/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/10 text-purple-400">
            <Users className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white">Team Roster</h2>
            <p className="text-[0.625rem] uppercase tracking-wider text-slate-500">
              {onlineCount} online · {onDutyCount} on duty · {MOCK_RESPONDERS.length} total
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(139,92,246,0.3)] transition hover:bg-purple-500 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add Team Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0a0f1a]/50 px-4 py-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="h-9 w-full rounded-lg border border-white/10 bg-[#0a0f1a] pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:outline-none"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-[#0a0f1a] px-3 text-sm text-white focus:border-purple-400/60 focus:outline-none [&>option]:bg-[#111827]"
        >
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ResponderStatus | "")}
          className="h-9 rounded-lg border border-white/10 bg-[#0a0f1a] px-3 text-sm text-white focus:border-purple-400/60 focus:outline-none [&>option]:bg-[#111827]"
        >
          <option value="">All statuses</option>
          <option value="online">Online</option>
          <option value="on-duty">On Duty</option>
          <option value="off-duty">Off Duty</option>
        </select>
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-[#0a0f1a] px-3 text-sm text-white focus:border-purple-400/60 focus:outline-none [&>option]:bg-[#111827]"
        >
          <option value="">All locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => toggleSort("name")}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
            sortField === "name"
              ? "border-purple-400/40 bg-purple-400/10 text-purple-400"
              : "border-white/10 text-slate-400 hover:bg-white/5"
          }`}
        >
          {sortField === "name" && (sortAsc ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
          Name
        </button>
        <button
          type="button"
          onClick={() => toggleSort("status")}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
            sortField === "status"
              ? "border-purple-400/40 bg-purple-400/10 text-purple-400"
              : "border-white/10 text-slate-400 hover:bg-white/5"
          }`}
        >
          {sortField === "status" && (sortAsc ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
          Status
        </button>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-3 h-10 w-10 text-slate-600" aria-hidden />
            <p className="text-sm text-slate-500">No team members match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((responder) => {
              const statusCfg = STATUS_CONFIG[responder.status];
              return (
                <div
                  key={responder.id}
                  className="group rounded-xl border border-white/10 bg-[#0a0f1a] p-3 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.02]"
                >
                  {/* Top row: avatar + name + status */}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-400/15 text-sm font-bold text-purple-400">
                        {responder.avatar}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0f1a] ${statusCfg.dot}`}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{responder.name}</p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider ${
                          ROLE_COLORS[responder.role] ?? "border-slate-400/40 bg-slate-400/10 text-slate-400"
                        }`}
                      >
                        {responder.role}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} aria-hidden />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />
                    <span className="truncate">{responder.location}</span>
                  </div>

                  {/* Assigned task */}
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />
                    <span className="truncate">{responder.assignedTask}</span>
                  </div>

                  {/* Contact buttons */}
                  <div className="mt-3 flex items-center gap-1.5 border-t border-white/5 pt-2.5">
                    <a
                      href={`tel:${responder.phone}`}
                      className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 text-[0.625rem] font-semibold text-slate-400 transition hover:border-emerald-400/30 hover:bg-emerald-400/5 hover:text-emerald-400"
                    >
                      <Phone className="h-3 w-3" aria-hidden />
                      Call
                    </a>
                    <a
                      href={`mailto:${responder.email}`}
                      className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 text-[0.625rem] font-semibold text-slate-400 transition hover:border-blue-400/30 hover:bg-blue-400/5 hover:text-blue-400"
                    >
                      <Mail className="h-3 w-3" aria-hidden />
                      Message
                    </a>
                    <button
                      type="button"
                      title="Edit responder"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-500 transition hover:border-white/20 hover:text-white"
                    >
                      <Edit3 className="h-3 w-3" aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/10 bg-[#0a0f1a]/80 px-4 py-2.5 backdrop-blur-md">
        <p className="text-[0.6875rem] uppercase tracking-wider text-slate-500">
          Showing <span className="font-bold text-white">{filtered.length}</span> of{" "}
          {MOCK_RESPONDERS.length} responders
        </p>
        <p className="hidden font-mono text-[0.625rem] uppercase tracking-[0.2em] text-slate-600 sm:block">
          GPS sync · live
        </p>
      </div>
    </section>
  );
}

export default TeamRoster;
