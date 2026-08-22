"use client";

import { useState } from "react";
import {
  Search,
  Users,
  MapPin,
  Phone,
  Plus,
  Filter,
  User,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

// ---------------------------------------------------------------------
// app/gov/missing-persons/page.tsx — Missing Persons Registry
//
// Dark-mode UI for reporting and tracking missing persons.
// Matches the gov dashboard theme: bg-[#0a0f1a] page bg,
// bg-[#111827] cards, blue focus rings, border-white/10.
// ---------------------------------------------------------------------

interface MissingPerson {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastKnownArea: string;
  contactName: string;
  contactPhone: string;
  relation: string;
  description: string;
  status: "missing" | "found" | "safe";
}

const STAT_CARDS: Array<{
  label: string;
  value: number;
  tone: string;
  icon: React.ReactNode;
}> = [
  { label: "Total", value: 0, tone: "text-white", icon: <Users size={18} /> },
  { label: "Missing", value: 0, tone: "text-red-400", icon: <AlertTriangle size={18} /> },
  { label: "Found", value: 0, tone: "text-emerald-400", icon: <CheckCircle2 size={18} /> },
  { label: "Safe", value: 0, tone: "text-sky-400", icon: <ShieldCheck size={18} /> },
];

const STATUS_CONFIG: Record<string, { style: string; icon: React.ReactNode }> = {
  missing: { style: "bg-red-500/15 text-red-400 border border-red-500/20", icon: <AlertTriangle size={12} /> },
  found: { style: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", icon: <CheckCircle2 size={12} /> },
  safe: { style: "bg-sky-500/15 text-sky-400 border border-sky-500/20", icon: <ShieldCheck size={12} /> },
};

export default function MissingPersonsPage() {
  const [records] = useState<MissingPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = records.filter((r) => {
    const matchesSearch =
      searchQuery === "" ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lastKnownArea.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Missing Persons Registry
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Report missing persons and mark them as found when located
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.97]"
          >
            <Plus size={16} />
            Report Missing Person
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {/* Stats Row — 4 columns */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STAT_CARDS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-[#111827] p-5"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{stat.icon}</span>
                <p className="eoc-label text-slate-400">{stat.label}</p>
              </div>
              <p className={`mt-2 font-mono text-3xl font-bold ${stat.tone}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search + Filter Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="missing">Missing</option>
              <option value="found">Found</option>
              <option value="safe">Safe</option>
            </select>
          </div>
        </div>

        {/* Records List */}
        <div className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#111827] py-16 text-center">
              <Users size={40} className="mb-3 text-slate-500" />
              <p className="text-sm font-medium text-slate-400">
                No missing persons reported
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Click &quot;Report Missing Person&quot; to add a new entry
              </p>
            </div>
          ) : (
            filtered.map((person) => (
              <div
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#111827] p-4 transition hover:border-white/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                    <User size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{person.name}</p>
                    <p className="text-xs text-slate-400">
                      Age {person.age} · {person.gender}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {person.lastKnownArea}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} />
                    {person.contactPhone}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${STATUS_CONFIG[person.status]?.style ?? ""}`}
                >
                  {STATUS_CONFIG[person.status]?.icon}
                  {person.status.charAt(0).toUpperCase() + person.status.slice(1)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Report Form */}
        <div className="mt-8 rounded-xl border border-white/10 bg-[#111827] p-6">
          <h2 className="text-lg font-semibold text-white">
            Report Missing Person
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Fill in the details below to file a missing person report
          </p>

          <form
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Name */}
            <div>
              <label className="eoc-label text-slate-400">Name</label>
              <input
                type="text"
                placeholder="Full name"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Age */}
            <div>
              <label className="eoc-label text-slate-400">Age</label>
              <input
                type="number"
                placeholder="Age"
                min={0}
                max={120}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="eoc-label text-slate-400">Gender</label>
              <select className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Last Known Area */}
            <div>
              <label className="eoc-label text-slate-400">
                Last Known Area
              </label>
              <input
                type="text"
                placeholder="Area or location"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label className="eoc-label text-slate-400">Contact Name</label>
              <input
                type="text"
                placeholder="Reporter name"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="eoc-label text-slate-400">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="Phone number"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Relation */}
            <div>
              <label className="eoc-label text-slate-400">Relation</label>
              <input
                type="text"
                placeholder="e.g. Parent, Sibling, Friend"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Description — full width */}
            <div className="sm:col-span-2">
              <label className="eoc-label text-slate-400">Description</label>
              <textarea
                rows={4}
                placeholder="Physical description, clothing, last seen circumstances..."
                className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Submit */}
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.97]"
              >
                <Plus size={16} />
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
