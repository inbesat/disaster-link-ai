"use client";

// ---------------------------------------------------------------------
// components/gov/tasks/TaskBoard.tsx — Task Assignment System.
//
// Kanban-style board with columns: Pending, In Progress, Completed.
// Tasks as cards with: title, assignee avatar, priority badge, deadline,
// location. Click-to-move between columns (accessible alternative to
// drag-and-drop). "Create Task" button opens a modal with full form.
// ---------------------------------------------------------------------

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";

export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in-progress" | "completed";

export type Task = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeAvatar: string;
  priority: TaskPriority;
  deadline: string;
  location: string;
  status: TaskStatus;
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; dot: string; chip: string }> = {
  urgent: {
    label: "Urgent",
    dot: "bg-red-400",
    chip: "border-red-400/40 bg-red-400/10 text-red-400",
  },
  high: {
    label: "High",
    dot: "bg-amber-400",
    chip: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  },
  medium: {
    label: "Medium",
    dot: "bg-blue-400",
    chip: "border-blue-400/40 bg-blue-400/10 text-blue-400",
  },
  low: {
    label: "Low",
    dot: "bg-slate-400",
    chip: "border-slate-400/40 bg-slate-400/10 text-slate-400",
  },
};

const COLUMN_CONFIG: Record<
  TaskStatus,
  { label: string; icon: typeof Clock; color: string; borderColor: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-400",
    borderColor: "border-t-amber-400",
  },
  "in-progress": {
    label: "In Progress",
    icon: Edit3,
    color: "text-blue-400",
    borderColor: "border-t-blue-400",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-400",
    borderColor: "border-t-emerald-400",
  },
};

const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    title: "Evacuate Zone A residents",
    description: "Move 412 residents from flood-prone Zone A to designated shelters.",
    assignee: "Amit Kumar",
    assigneeAvatar: "AK",
    priority: "urgent",
    deadline: "Today 13:00",
    location: "Zone A, Rampur",
    status: "pending",
  },
  {
    id: "t2",
    title: "Deploy rescue boats to Punpun",
    description: "Launch 8 NDRF boats for water rescue operations.",
    assignee: "Rajesh Verma",
    assigneeAvatar: "RV",
    priority: "high",
    deadline: "Today 11:00",
    location: "Punpun Ghat",
    status: "in-progress",
  },
  {
    id: "t3",
    title: "Set up medical station at Shelter B",
    description: "Establish first-aid post with cholera care packs.",
    assignee: "Priya Singh",
    assigneeAvatar: "PS",
    priority: "high",
    deadline: "Today 12:00",
    location: "Zilla School",
    status: "in-progress",
  },
  {
    id: "t4",
    title: "Distribute food rations to NH-01",
    description: "Load 120 pallets of ready-to-eat rations onto transport vehicles.",
    assignee: "Sunita Devi",
    assigneeAvatar: "SD",
    priority: "medium",
    deadline: "Today 14:00",
    location: "NH-01 Staging",
    status: "pending",
  },
  {
    id: "t5",
    title: "Broadcast SMS alert to Zone C",
    description: "Send emergency evacuation SMS to 4,200 subscribers.",
    assignee: "Anita Patel",
    assigneeAvatar: "AP",
    priority: "medium",
    deadline: "Today 10:30",
    location: "District HQ",
    status: "completed",
  },
  {
    id: "t6",
    title: "Inspect Daulatpur Bridge integrity",
    description: "Structural assessment before route diversion decision.",
    assignee: "Vikram Singh",
    assigneeAvatar: "VS",
    priority: "urgent",
    deadline: "Today 09:00",
    location: "Daulatpur Bridge",
    status: "completed",
  },
  {
    id: "t7",
    title: "Transport ambulances to Rampur",
    description: "Move 4 field ambulances from Zilla School to Rampur High School.",
    assignee: "Mohammad Khan",
    assigneeAvatar: "MK",
    priority: "high",
    deadline: "Today 11:30",
    location: "Rampur High School",
    status: "pending",
  },
  {
    id: "t8",
    title: "Coordinate with NDRF 2nd Bn",
    description: "Sync boat deployment schedule with NDRF command.",
    assignee: "Amit Kumar",
    assigneeAvatar: "AK",
    priority: "medium",
    deadline: "Today 15:00",
    location: "Punpun Ghat",
    status: "pending",
  },
];

// ---------------------------------------------------------------------
// Create Task Modal
// ---------------------------------------------------------------------

function CreateTaskModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (task: Omit<Task, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignee.trim()) return;
    const initials = assignee
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    onCreate({
      title: title.trim(),
      description: description.trim(),
      assignee: assignee.trim(),
      assigneeAvatar: initials,
      priority,
      deadline: deadline || "No deadline",
      location: location || "Unassigned",
      status: "pending",
    });
    setTitle("");
    setDescription("");
    setAssignee("");
    setPriority("medium");
    setDeadline("");
    setLocation("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Create Task</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Evacuate Zone A"
              className="w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief task description..."
              className="w-full resize-none rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-400">Assignee *</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                required
                placeholder="Responder name"
                className="w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 focus:outline-none [&>option]:bg-[#111827]"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-400">Deadline</label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. Today 14:00"
                className="w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-400">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Punpun Ghat"
                className="w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_12px_rgba(139,92,246,0.3)] transition hover:bg-purple-500 active:scale-95"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Task Card
// ---------------------------------------------------------------------

function TaskCard({
  task,
  onMove,
  onDelete,
}: {
  task: Task;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}) {
  const priority = PRIORITY_CONFIG[task.priority];
  const nextStatus: Record<TaskStatus, TaskStatus | null> = {
    pending: "in-progress",
    "in-progress": "completed",
    completed: null,
  };
  const next = nextStatus[task.status];

  return (
    <div className="group rounded-xl border border-white/10 bg-[#0a0f1a] p-3 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.02]">
      {/* Priority + actions */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider ${priority.chip}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} aria-hidden />
          {priority.label}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            title="Delete task"
            onClick={() => onDelete(task.id)}
            className="rounded p-1 text-slate-600 transition hover:bg-red-400/10 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="mt-2 text-sm font-bold text-white leading-snug">{task.title}</p>
      {task.description && (
        <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Assignee */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-400/15 text-[0.5rem] font-bold text-purple-400">
          {task.assigneeAvatar}
        </div>
        <span className="text-xs text-slate-400">{task.assignee}</span>
      </div>

      {/* Deadline + Location */}
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5 text-[0.625rem] text-slate-500">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          {task.deadline}
        </div>
        <div className="flex items-center gap-1.5 text-[0.625rem] text-slate-500">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          {task.location}
        </div>
      </div>

      {/* Move button */}
      {next && (
        <button
          type="button"
          onClick={() => onMove(task.id, next)}
          className={`mt-3 w-full rounded-lg border border-white/10 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-wider transition ${
            next === "in-progress"
              ? "text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/5"
              : "text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/5"
          }`}
        >
          Move to {COLUMN_CONFIG[next].label} →
        </button>
      )}
      {task.status === "completed" && (
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-wider text-emerald-400">
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          Done
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Main Board
// ---------------------------------------------------------------------

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [showCreate, setShowCreate] = useState(false);

  const grouped = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      pending: [],
      "in-progress": [],
      completed: [],
    };
    tasks.forEach((t) => groups[t.status].push(t));
    return groups;
  }, [tasks]);

  const handleMove = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
  };

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCreate = (newTask: Omit<Task, "id">) => {
    setTasks((prev) => [
      ...prev,
      { ...newTask, id: `t-${Date.now()}` },
    ]);
  };

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0f1a]/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/10 text-purple-400">
            <Edit3 className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white">Task Board</h2>
            <p className="text-[0.625rem] uppercase tracking-wider text-slate-500">
              {tasks.length} tasks · {grouped.pending.length} pending · {grouped["in-progress"].length} active
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(139,92,246,0.3)] transition hover:bg-purple-500 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Create Task
        </button>
      </div>

      {/* Columns */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {(["pending", "in-progress", "completed"] as const).map((status) => {
            const col = COLUMN_CONFIG[status];
            const ColIcon = col.icon;
            const colTasks = grouped[status];
            return (
              <div key={status} className="flex flex-col">
                {/* Column header */}
                <div className={`mb-3 flex items-center gap-2 border-t-2 ${col.borderColor} pt-3`}>
                  <ColIcon className={`h-4 w-4 ${col.color}`} aria-hidden />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                    {col.label}
                  </h3>
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/5 px-1.5 font-mono text-[0.5625rem] font-bold text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="space-y-2.5">
                  {colTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
                      <p className="text-xs text-slate-600">No tasks</p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onMove={handleMove}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </section>
  );
}

export default TaskBoard;
