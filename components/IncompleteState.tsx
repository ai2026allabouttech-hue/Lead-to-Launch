"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";

export function IncompleteState({
  title,
  description,
  prevPhaseLabel,
  onPrev,
}: {
  title: string;
  description: string;
  prevPhaseLabel: string;
  onPrev?: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 px-6 text-center max-w-xl mx-auto">
        <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-5">
          <Lock className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Preview · No data yet
        </div>
        <h2 className="font-display text-2xl mb-3">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{description}</p>
        {onPrev && (
          <Button variant="outline" onClick={onPrev} className="h-10 px-4">
            <ArrowLeft className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Go to {prevPhaseLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
