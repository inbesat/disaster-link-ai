"use client";

import { useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------
// components/agents/DecisionLog.tsx
// Dark terminal/console that reveals the agents' chain-of-reasoning with a
// typewriter effect. Each line's agent name is color-coded:
//   [Predictor Agent]     sky      [Planner Agent]   purple
//   [Allocator Agent]     amber    [Communicator]    green
// ---------------------------------------------------------------------

const SEP = "\n\n";

const AGENT_COLORS: Array<[RegExp, string]> = [
  [/Communicator/i, "text-severity-green-400"],
  [/Allocator/i, "text-severity-amber-400"],
  [/Planner/i, "text-severity-purple-400"],
  [/Predictor/i, "text-sky-400"],
];

function agentColor(name: string): string {
  const match = AGENT_COLORS.find(([re]) => re.test(name));
  return match ? match[1] : "text-slate-200";
}

type Props = {
  logs: string[];
  speed?: number; // ms per character
};

export default function DecisionLog({ logs, speed = 6 }: Props) {
  const fullText = useMemo(() => logs.join(SEP), [logs]);
  const [length, setLength] = useState(0);
  const [done, setDone] = useState(false);

  // Restart whenever the underlying log list changes.
  useEffect(() => {
    setLength(0);
    setDone(fullText.length === 0);
  }, [fullText]);

  useEffect(() => {
    if (done || length >= fullText.length) {
      if (!done && length >= fullText.length) setDone(true);
      return;
    }
    const timer = setTimeout(() => {
      setLength((l) => l + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [length, fullText, done, speed]);

  const visible = fullText.slice(0, length);
  const lines = visible.length ? visible.split(SEP) : [];

  return (
    <div className="overflow-hidden rounded-eoc border border-border bg-black/70">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted/60 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-severity-red-500" />
        <span className="h-2 w-2 rounded-full bg-severity-amber-500" />
        <span className="h-2 w-2 rounded-full bg-severity-green-500" />
        <span className="ml-2 font-mono text-[11px] text-slate-400">
          agent-console · chain-of-reasoning
        </span>
        {done && (
          <span className="ml-auto font-mono text-[10px] text-severity-green-400">
            idle
          </span>
        )}
      </div>

      {/* Terminal body */}
      <div className="min-h-[180px] space-y-3 p-4">
        {lines.length === 0 && (
          <p className="font-mono text-xs text-slate-600">
            $ waiting for incident… run the orchestration to begin
          </p>
        )}

        {lines.map((line, i) => {
          const colon = line.indexOf(":");
          const agent = colon >= 0 ? line.slice(0, colon).trim() : "";
          const message = colon >= 0 ? line.slice(colon + 1).trim() : line;
          return (
            <div key={i} className="font-mono text-[12px] leading-relaxed">
              <span className={agentColor(agent)}>[{agent || "Agent"}]</span>{" "}
              <span className="text-slate-300">{message}</span>
              {i === lines.length - 1 && !done && (
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-sky-400 align-middle" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}