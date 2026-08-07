"use client";

type AgentStatus = "idle" | "active" | "done";

export type AgentNodeProps = {
  name: string;
  role: string;
  status: AgentStatus;
};

const NODE_THEMES: Record<
  string,
  {
    dot: string;
    border: string;
    glow: string;
    text: string;
  }
> = {
  Predictor: {
    dot: "bg-sky-400",
    border: "border-sky-400/60",
    glow: "shadow-glow-accent",
    text: "text-sky-300",
  },
  Planner: {
    dot: "bg-severity-purple-400",
    border: "border-severity-purple-400/60",
    glow: "shadow-glow-purple",
    text: "text-severity-purple-300",
  },
  Allocator: {
    dot: "bg-severity-amber-400",
    border: "border-severity-amber-400/60",
    glow: "shadow-glow-amber",
    text: "text-severity-amber-300",
  },
  Communicator: {
    dot: "bg-severity-green-400",
    border: "border-severity-green-400/60",
    glow: "shadow-glow-green",
    text: "text-severity-green-300",
  },
};

export default function AgentNode({ name, role, status }: AgentNodeProps) {
  const theme = NODE_THEMES[name] ?? NODE_THEMES.Predictor;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300 ${
          status === "active"
            ? `${theme.border} ${theme.glow} animate-pulse-ring`
            : status === "done"
              ? `${theme.border} opacity-90`
              : "border-border opacity-40"
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full ${theme.dot} ${
            status === "active" ? "animate-ping" : ""
          }`}
        />
        {status === "done" && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-severity-green-500 text-[10px] font-black text-slate-950">
            ✓
          </span>
        )}
        {status === "active" && (
          <span className="eoc-label absolute -bottom-1 whitespace-nowrap text-[10px] text-slate-300">
            ACTIVE
          </span>
        )}
      </div>

      <p className={`text-sm font-black tracking-wide ${theme.text}`}>{name}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{role}</p>
    </div>
  );
}