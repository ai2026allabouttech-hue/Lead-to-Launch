"use client";

import { motion } from "framer-motion";
import { Check, Search, FileSearch, Trophy, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Scrape", icon: Search },
  { id: 2, label: "Audit", icon: FileSearch },
  { id: 3, label: "Rank", icon: Trophy },
  { id: 4, label: "Build", icon: Sparkles },
  { id: 5, label: "Outreach", icon: Send },
];

export function Stepper({
  current,
  completed,
  onJump,
}: {
  current: number;
  completed: Set<number>;
  onJump: (n: number) => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 pb-6 pt-2" role="navigation" aria-label="Pipeline progress">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground text-center mb-3">
        Step <span className="font-mono text-foreground">{String(current).padStart(2, "0")}</span> of <span className="font-mono">05</span> · {STEPS[current - 1]?.label}
      </div>
      <div className="w-full flex items-center justify-between gap-2">
      {STEPS.map((step, i) => {
        const isDone = completed.has(step.id);
        const isCurrent = current === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => onJump(step.id)}
              aria-label={`Phase ${step.id} of ${STEPS.length}: ${step.label}${isCurrent ? " (current)" : isDone ? " (completed)" : " (preview)"}`}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex flex-col items-center gap-2 group transition-opacity rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-1 cursor-pointer",
                !isCurrent && !isDone && "opacity-70 hover:opacity-100",
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.05 : 1,
                  backgroundColor: isCurrent ? "var(--primary)" : isDone ? "var(--accent)" : "var(--card)",
                }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center border",
                  isCurrent
                    ? "border-primary/40 text-primary-foreground"
                    : isDone
                      ? "border-accent-foreground/20 text-accent-foreground"
                      : "border-border text-muted-foreground",
                )}
              >
                {isDone && !isCurrent ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <Icon className="h-4 w-4" strokeWidth={1.5} />}
              </motion.div>
              <span className={cn("text-[11px] tracking-wide uppercase", isCurrent ? "text-foreground font-medium" : "text-muted-foreground")}>
                {String(step.id).padStart(2, "0")} · {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 relative overflow-hidden bg-border">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isDone ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ originX: 0 }}
                  className="absolute inset-0 bg-primary/50"
                />
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
