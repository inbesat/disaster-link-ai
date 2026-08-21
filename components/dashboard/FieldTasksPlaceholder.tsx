const TASKS = [
  {
    id: "T-1042",
    title: "Position rescue boat at Kankarbagh checkpoint",
    status: "In Transit",
  },
  {
    id: "T-1043",
    title: "Distribute 120 food rations at Sonepur Relief Camp",
    status: "Pending",
  },
  {
    id: "T-1044",
    title: "Recheck shelter capacity at Riverside High School",
    status: "Pending",
  },
  { id: "T-1045", title: "Report NH-31 Digha road blockage", status: "Done" },
];

const STATUS_STYLES: Record<string, string> = {
  "In Transit": "border-sky-400 text-sky-300",
  Pending: "border-severity-amber-500 text-severity-amber-400",
  Done: "border-severity-green-600 text-severity-green-400",
};

export default function FieldTasksPlaceholder() {
  return (
    <div className="rounded-eoc border-2 border-dashed border-accent/40 bg-accent/5 p-5">
      <p className="eoc-label text-accent">FIELD RESPONDER</p>
      <h2 className="mt-1 text-lg font-bold text-foreground">My Assigned Tasks</h2>
      <p className="mt-1 text-xs text-slate-400">Your dispatch queue for this shift.</p>

      <ul className="mt-3 space-y-3">
        {TASKS.map((task) => (
          <li key={task.id} className="rounded-eoc border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-eoc-tiny font-bold text-slate-500">
                {task.id}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-eoc-tiny font-bold uppercase tracking-wider ${STATUS_STYLES[task.status]}`}
              >
                {task.status}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">{task.title}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
