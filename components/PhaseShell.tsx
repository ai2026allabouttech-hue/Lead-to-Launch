"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function PhaseShell({
  title,
  subtitle,
  children,
  onPrev,
  onNext,
  nextLabel = "Next phase",
  nextDisabled = false,
  prevDisabled = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  prevDisabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-4 sm:px-6 pb-32"
    >
      <header className="mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-[1.05]">{title}</h1>
        <p className="text-muted-foreground mt-4 text-base max-w-2xl leading-relaxed">{subtitle}</p>
      </header>
      <div>{children}</div>
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={prevDisabled || !onPrev}
            aria-label="Go to previous phase"
            className="h-10 px-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1.5" strokeWidth={1.75} /> Back
          </Button>
          <Button
            onClick={onNext}
            disabled={nextDisabled || !onNext}
            aria-label={nextLabel}
            className="h-10 px-5 transition-transform duration-150 active:scale-[0.98]"
          >
            {nextLabel} <ChevronRight className="h-4 w-4 ml-1.5" strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
