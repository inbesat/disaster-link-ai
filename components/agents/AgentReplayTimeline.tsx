"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CloudRain, 
  MapPin, 
  Package, 
  Radio, 
  UserCheck,
  ShieldCheck 
} from "lucide-react";

// Mock data showing a realistic disaster response flow (aligned with the
// five orchestration agents: Predictor → Planner → Allocator → Validator →
// Communicator, plus the human checkpoint).
const TIMELINE_STEPS = [
  {
    id: "step-1",
    agent: "Predictor Agent",
    icon: CloudRain,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/20",
    action: "Detected critical risk in Patna district",
    dataUsed: "rainfall 180mm/24h",
    timestamp: "14:28 IST",
  },
  {
    id: "step-2",
    agent: "Planner Agent",
    icon: MapPin,
    color: "text-severity-purple-400",
    bgColor: "bg-severity-purple-400/10",
    borderColor: "border-severity-purple-400/20",
    action: "Generated 48h evacuation plan for 3 villages",
    dataUsed: "47,230 people at risk",
    timestamp: "14:29 IST",
  },
  {
    id: "step-3",
    agent: "Allocator Agent",
    icon: Package,
    color: "text-severity-amber-400",
    bgColor: "bg-severity-amber-400/10",
    borderColor: "border-severity-amber-400/20",
    action: "Assigned 12 boats, 5 ambulances",
    dataUsed: "nearest depot 8km",
    timestamp: "14:30 IST",
  },
  {
    id: "step-4",
    agent: "Validator Agent",
    icon: ShieldCheck,
    color: "text-severity-red-400",
    bgColor: "bg-severity-red-400/10",
    borderColor: "border-severity-red-400/20",
    action: "Cross-checked plan against shelter capacity",
    dataUsed: "no conflicts found",
    timestamp: "14:31 IST",
  },
  {
    id: "step-5",
    agent: "Communicator Agent",
    icon: Radio,
    color: "text-severity-green-400",
    bgColor: "bg-severity-green-400/10",
    borderColor: "border-severity-green-400/20",
    action: "Sent SMS alerts to 1,200 responders",
    dataUsed: "alert template #3",
    timestamp: "14:31 IST",
  },
  {
    id: "step-6",
    agent: "Human Checkpoint",
    icon: UserCheck,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/20",
    action: "District Admin approved plan",
    dataUsed: "approval at 14:32 IST",
    timestamp: "14:32 IST",
  }
];

export default function AgentReplayTimeline() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentStepIndex < TIMELINE_STEPS.length - 1) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 1500); // Reveal a new step every 1.5s
    } else if (currentStepIndex >= TIMELINE_STEPS.length - 1) {
      setIsPlaying(false);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex]);

  const handlePlayPause = () => {
    if (currentStepIndex >= TIMELINE_STEPS.length - 1) {
      setCurrentStepIndex(-1); // Reset if at the end
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
  };

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-[var(--bg-secondary)] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Multi-Agent Collaboration Replay</h3>
          <p className="text-sm text-muted">Watch how agents coordinated to respond to the disaster event.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-subtle bg-tertiary text-muted transition hover:text-slate-200"
            aria-label="Reset replay"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> {currentStepIndex === -1 ? "Play" : currentStepIndex >= TIMELINE_STEPS.length - 1 ? "Replay" : "Resume"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative ml-4 border-l border-subtle pb-4 pt-2">
        <AnimatePresence>
          {TIMELINE_STEPS.map((step, index) => {
            const isVisible = index <= currentStepIndex;
            
            if (!isVisible) return null;
            
            const Icon = step.icon;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative mb-8 pl-8 last:mb-0"
              >
                {/* Timeline Dot */}
                <div className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-[#0a0f1a] ring-4 ring-[var(--bg-secondary)]`}>
                  <Icon className={`h-4 w-4 ${step.color}`} />
                </div>

                <div className={`rounded-lg border ${step.borderColor} ${step.bgColor} p-4`}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className={`font-semibold ${step.color}`}>{step.agent}</span>
                    <span className="text-xs text-muted">{step.timestamp}</span>
                  </div>
                  
                  <p className="mb-3 text-sm text-slate-200">{step.action}</p>
                  
                  <div className="inline-flex rounded border border-border bg-tertiary px-2.5 py-1 text-xs font-medium text-slate-400">
                    <span className="mr-2 text-muted">Data used:</span>
                    {step.dataUsed}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state when nothing is revealed yet */}
        {currentStepIndex === -1 && (
          <div className="pl-8 text-sm italic text-muted">
            Click Play to see the multi-agent collaboration timeline.
          </div>
        )}
      </div>
    </div>
  );
}
