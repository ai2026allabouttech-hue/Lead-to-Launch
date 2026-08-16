"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { Crown, IndianRupee, MessageCircle, Phone, Mail } from "lucide-react";
import type { Lead, AuditResult, RankedLead } from "@/lib/types";
import { scoreLead } from "@/lib/scoring";

export function Phase3Rank({
  leads,
  audits,
  selectedId,
  setSelectedId,
  onNext,
  onPrev,
}: {
  leads: Lead[];
  audits: Record<string, AuditResult>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const ranked: RankedLead[] = useMemo(() => {
    return leads
      .filter((l) => audits[l.id])
      .map((l) => scoreLead(l, audits[l.id]))
      .sort((a, b) => b.score - a.score);
  }, [leads, audits]);

  if (ranked.length === 0) {
    return (
      <PhaseShell
        title="Phase 3 — Ranked prospects"
        subtitle="Conversion score blends site quality, review volume, rating, reachability, and industry fit. Pick one to build for."
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled
        nextLabel="Build website"
      >
        <IncompleteState
          title={leads.length === 0 ? "No leads scraped yet" : "No audits yet"}
          description={
            leads.length === 0
              ? "Phases 1 and 2 haven't been run. After scraping leads and auditing them, this page ranks each by conversion potential and lets you pick one to build for."
              : "Run an audit in Phase 2 first. Once leads have audits, we score them on site quality, review volume, rating, reachability, and industry fit — then sort for highest conversion potential."
          }
          prevPhaseLabel={leads.length === 0 ? "Scrape" : "Audit"}
          onPrev={onPrev}
        />
      </PhaseShell>
    );
  }

  return (
    <PhaseShell
      title="Phase 3 — Ranked prospects"
      subtitle="Conversion score blends site quality, review volume, rating, reachability, and industry fit. Pick one to build for."
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={!selectedId}
      nextLabel="Build website"
    >
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {ranked.slice(0, 3).map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              role="button"
              tabIndex={0}
              aria-pressed={selectedId === lead.id}
              aria-label={`Select rank ${i + 1}: ${lead.name}`}
              onClick={() => setSelectedId(lead.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(lead.id);
                }
              }}
              className={`cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:-translate-y-0.5 ${
                selectedId === lead.id
                  ? "ring-1 ring-primary border-primary/30"
                  : "hover:border-primary/30"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 font-medium tracking-wide uppercase text-muted-foreground">
                    <Crown className="h-3.5 w-3.5 text-[color:var(--chart-4)]" strokeWidth={1.5} />
                    Rank · {String(i + 1).padStart(2, "0")}
                  </CardTitle>
                  <div className="font-display text-3xl tabular-nums leading-none">{lead.score}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-medium text-base leading-snug">{lead.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{lead.address || "Address needs lookup"}</div>
                <div className="mt-4 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    {lead.audit.estLostRevenuePerMonth > 0
                      ? <><IndianRupee className="h-3 w-3 text-muted-foreground" />{lead.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/mo</>
                      : <span className="text-muted-foreground">Impact not estimated</span>}
                  </span>
                  <span className="text-border">·</span>
                  <span className="text-muted-foreground">{lead.reviewsCount != null ? `${lead.reviewsCount} reviews` : "Reviews needs lookup"}</span>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {lead.phone && <Phone className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />}
                  {lead.whatsapp && <MessageCircle className="h-3.5 w-3.5 text-[color:var(--accent-foreground)]" strokeWidth={1.5} />}
                  {lead.email && <Mail className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All ranked</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead className="w-[260px]">Score</TableHead>
                  <TableHead>₹ Lost / mo</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead className="text-right">Select</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((lead, i) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    aria-selected={selectedId === lead.id}
                    className={`border-b border-border cursor-pointer transition-colors duration-150 hover:bg-muted/40 ${selectedId === lead.id ? "bg-primary/5" : ""}`}
                    onClick={() => setSelectedId(lead.id)}
                  >
                    <TableCell className="font-medium tabular-nums">{i + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.reviewsCount} reviews · {lead.rating}★</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lead.score}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                            className="h-full bg-primary"
                          />
                        </div>
                        <span className="font-mono text-sm tabular-nums w-9 text-right">{lead.score}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-sm">
                      {lead.audit.estLostRevenuePerMonth > 0
                        ? `₹${lead.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}`
                        : <span className="text-muted-foreground">Not estimated</span>}
                    </TableCell>
                    <TableCell>
                      {lead.audit.hasWebsite ? (
                        <Badge variant="secondary" className="text-xs font-normal">{lead.audit.pageSpeedScore} PageSpeed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs font-normal text-[color:var(--destructive)] border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/5">None</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={selectedId === lead.id ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(lead.id);
                        }}
                      >
                        {selectedId === lead.id ? "Selected" : "Select"}
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            {ranked.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">Run audit first</div>}
          </div>
        </CardContent>
      </Card>
    </PhaseShell>
  );
}
