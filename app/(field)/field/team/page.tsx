import type { Metadata } from "next";
import { Users, Phone, Radio, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "My Team | Field",
};

const TEAM = [
  { initials: "SD", name: "Sunita Das", role: "Team Lead · NDRF", status: "On Duty", tone: "border-emerald-400/50 bg-emerald-500/10 text-emerald-300" },
  { initials: "RK", name: "Ravi Kumar", role: "Boat Operator", status: "En Route", tone: "border-amber-400/50 bg-amber-500/10 text-amber-300" },
  { initials: "MN", name: "Meera Nair", role: "Field Medic", status: "On Duty", tone: "border-emerald-400/50 bg-emerald-500/10 text-emerald-300" },
  { initials: "AS", name: "Arjun Singh", role: "Radio Operator", status: "On Duty", tone: "border-emerald-400/50 bg-emerald-500/10 text-emerald-300" },
  { initials: "PL", name: "Priya Lakra", role: "Logistics", status: "Standby", tone: "border-slate-400/50 bg-slate-500/10 text-slate-300" },
];

export default function FieldTeamPage() {
  const onDuty = TEAM.filter((m) => m.status !== "Standby").length;
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-300">My Unit · SDRF-4</h1>
          <p className="mt-1 text-base text-gray-400">
            Patna District · Team Alpha
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-1.5 text-sm font-bold text-cyan-300">
          <Users className="h-4 w-4" aria-hidden />
          {onDuty}/{TEAM.length} on duty
        </span>
      </header>

      <ul className="space-y-3">
        {TEAM.map((m) => (
          <li
            key={m.initials}
            className="flex items-center gap-4 rounded-2xl border-2 border-[#1c2740] bg-[#0d1526] p-4"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-400/60 bg-amber-500/15 text-base font-bold text-amber-300">
              {m.initials}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-lg font-bold text-gray-100">{m.name}</p>
              <p className="truncate text-sm text-gray-400">{m.role}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider ${m.tone}`}>
                {m.status}
              </span>
              <a
                href="tel:+911123456789"
                aria-label={`Call ${m.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-400/50 bg-emerald-500/10 text-emerald-300 transition active:scale-95"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </li>
        ))}
      </ul>

      {/* Unit radio net */}
      <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-500/5 p-4">
        <p className="flex items-center gap-2 text-base font-bold text-amber-300">
          <Radio className="h-5 w-5" aria-hidden /> Unit Radio Net — Ch. 4
        </p>
        <p className="mt-1 text-sm text-gray-400">
          SDRF-4 Alpha is broadcasting on VHF Channel 4. Fallback: Command
          Center relay on Ch. 9.
        </p>
        <p className="mt-2 flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-widest text-cyan-300">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          Last sync 09:42 · {onDuty} responders reachable
        </p>
      </div>
    </div>
  );
}
