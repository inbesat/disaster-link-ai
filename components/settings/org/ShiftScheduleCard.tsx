"use client";

// ---------------------------------------------------------------------
// components/settings/org/ShiftScheduleCard.tsx — Organization (Phase 5 · Step 7).
//
// Roster / shift schedule configurator:
//   • Standard duty shifts (Morning 06:00–14:00, Evening 14:00–22:00,
//     Night 22:00–06:00) with editable start/end times.
//   • Which shift is "active" in the roster, selectable from the table.
//   • Simple multi-select dropdown assigns mock team members to the active
//     shift's roster.
//   • Helper note explaining alert routing around DND-enabled responders.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import { AlarmClock, AlertTriangle, ChevronDown, Users } from "lucide-react";
import {
  DEFAULT_ROSTER,
  DEFAULT_SHIFTS,
  TEAM_MEMBERS,
  findShiftConflicts,
  type Shift,
  type ShiftId,
  type ShiftRoster,
} from "@/lib/settings/shift-schedule";

export default function ShiftScheduleCard() {
  const [shifts, setShifts] = useState<Shift[]>(DEFAULT_SHIFTS);
  const [activeShiftId, setActiveShiftId] = useState<ShiftId>("night");
  const [roster, setRoster] = useState<ShiftRoster>(DEFAULT_ROSTER);
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeShift = shifts.find((s) => s.id === activeShiftId)!;
  const activeRoster = roster[activeShiftId];

  // Phase 10 · Step 5 — conflict detection: a responder booked into more
  // than one shift is a scheduling hazard (double duty rotations, confused
  // alert routing). Pure helper from lib/settings/shift-schedule.
  const conflicts = findShiftConflicts(roster);

  function setTime(id: ShiftId, field: "start" | "end", value: string) {
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  function toggleMember(name: string) {
    setRoster((prev) => {
      const current = prev[activeShiftId];
      return {
        ...prev,
        [activeShiftId]: current.includes(name)
          ? current.filter((n) => n !== name)
          : [...current, name],
      };
    });
    toast(
      `${name} ${roster[activeShiftId].includes(name) ? "removed from" : "added to"} ${activeShift.name} shift.`,
      { duration: 2000 },
    );
  }

  async function clearAssigned() {
    setRoster((prev) => ({ ...prev, [activeShiftId]: [] }));
    toast(`${activeShift.name} shift roster cleared.`, { duration: 2500 });
  }

  return (
    <section
      data-settings-key="org-shift-schedule"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
          <AlarmClock className="h-5 w-5 text-teal-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-teal-300/80">ROSTER</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Shift Schedule Configurator
          </h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Standard duty shifts define when the command centre stays reachable
        around the clock.
      </p>

      {/* Conflict warning — surfaces double-booked responders (Step 5) */}
      {conflicts.length > 0 && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-md border border-amber-400/50 bg-amber-500/10 px-3 py-2.5"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
            aria-hidden
          />
          <div className="text-xs leading-relaxed">
            <p className="font-bold uppercase tracking-wider text-amber-300">
              Shift conflict{conflicts.length === 1 ? "" : "s"} detected
            </p>
            <p className="mt-1 text-slate-300">
              {conflicts
                .map(
                  (c) =>
                    `${c.member} is on ${c.shifts
                      .map((s) => s.toLowerCase())
                      .join(" + ")} — assign them to one shift only.`,
                )
                .join(" ")}
            </p>
          </div>
        </div>
      )}

      {/* Shift table */}
      <div className="mt-5 overflow-x-auto rounded-md border border-[#1c2740]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1c2740] bg-surface-muted/40 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <th className="px-4 py-2.5">Shift</th>
              <th className="px-4 py-2.5">Start</th>
              <th className="px-4 py-2.5">End</th>
              <th className="px-4 py-2.5 text-right">Roster</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift, index) => {
              const isActiveShift = shift.id === activeShiftId;
              const count = roster[shift.id].length;
              return (
                <tr
                  key={shift.id}
                  className={`border-b border-[#152033] last:border-b-0 ${
                    index % 2 === 0 ? "bg-[#0a0f1d]" : "bg-surface-muted/20"
                  } ${isActiveShift ? "bg-teal-500/[0.06]" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5 text-teal-300">
                        {isActiveShift && (
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                        )}
                        <span
                          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                            isActiveShift ? "bg-teal-400" : "bg-slate-600"
                          }`}
                        />
                      </span>
                      <p
                        className={`font-semibold ${
                          isActiveShift ? "text-teal-200" : "text-slate-200"
                        }`}
                      >
                        {shift.name}
                      </p>
                      {isActiveShift && (
                        <span className="rounded-full border border-teal-400/50 bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-300">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={shift.start}
                      onChange={(e) => setTime(shift.id, "start", e.target.value)}
                      aria-label={`${shift.name} shift start time`}
                      className="rounded-md border border-[#1c2740] bg-[#0a0f1d] px-2 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-teal-400/60"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={shift.end}
                      onChange={(e) => setTime(shift.id, "end", e.target.value)}
                      aria-label={`${shift.name} shift end time`}
                      className="rounded-md border border-[#1c2740] bg-[#0a0f1d] px-2 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-teal-400/60"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveShiftId(shift.id)}
                      aria-pressed={isActiveShift}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                        isActiveShift
                          ? "border-teal-400/50 bg-teal-500/10 text-teal-200"
                          : "border-[#1c2740] text-slate-500 hover:border-teal-400/40 hover:text-teal-200"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      Active · {count}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Active shift roster + multiselect */}
      <div
        className={`mt-4 rounded-md border p-4 transition ${
          activeShiftId === "night"
            ? "border-teal-400/50 bg-teal-500/[0.06]"
            : "border-[#1c2740] bg-surface-muted/40"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-200">
              Active {activeShift.name} Shift Roster
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {activeShift.start} – {activeShift.end} IST · {activeRoster.length}{" "}
              member{activeRoster.length === 1 ? "" : "s"} on duty
            </p>
          </div>

          {/* Multi-select dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
              className="inline-flex items-center gap-2 rounded-md border border-teal-400/40 bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-200 transition hover:bg-teal-500/20"
            >
              Assign members
              <span className="flex items-center gap-1">
                <span className="rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-bold">
                  {activeRoster.length}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${pickerOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </span>
            </button>

            {pickerOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close member picker"
                  onClick={() => setPickerOpen(false)}
                />
                <div
                  role="listbox"
                  aria-label={`Assign team members to the ${activeShift.name} shift`}
                  className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-md border border-[#1c2740] bg-surface shadow-2xl"
                >
                  {TEAM_MEMBERS.map((member) => {
                    const assigned = activeRoster.includes(member.name);
                    return (
                      <label
                        key={member.name}
                        className="flex cursor-pointer items-center gap-2.5 border-b border-[#152033] px-3 py-2 text-sm transition last:border-b-0 hover:bg-teal-500/10"
                      >
                        <input
                          type="checkbox"
                          checked={assigned}
                          onChange={() => toggleMember(member.name)}
                          className="h-3.5 w-3.5 cursor-pointer accent-teal-500"
                        />
                        <span className="flex-1 text-slate-200">
                          {member.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">
                          {member.role}
                        </span>
                      </label>
                    );
                  })}
                  <div className="flex items-center justify-between gap-2 bg-surface-muted/40 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setPickerOpen(false)}
                      className="text-xs font-semibold text-slate-400 transition hover:text-slate-200"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={clearAssigned}
                      className="text-xs font-semibold text-red-300 transition hover:text-red-200"
                    >
                      Clear roster
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Assigned chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {activeRoster.length === 0 ? (
            <p className="text-xs text-slate-500">
              No one on the {activeShift.name} shift yet — alerts may go
              unanswered during this window.
            </p>
          ) : (
            activeRoster.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/40 bg-teal-500/10 py-0.5 pl-2 pr-1 text-xs font-semibold text-teal-100"
              >
                {name}
                <button
                  type="button"
                  onClick={() => toggleMember(name)}
                  aria-label={`Remove ${name} from ${activeShift.name} shift`}
                  className="rounded-full px-1 text-teal-300/70 transition hover:bg-red-500/20 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Helper note */}
      <p className="mt-4 rounded-md border border-[#1c2740] bg-surface-muted/40 px-3 py-2.5 text-xs leading-relaxed text-slate-400">
        Alerts routed to DND-enabled responders will automatically divert to
        the active shift roster.
      </p>
    </section>
  );
}