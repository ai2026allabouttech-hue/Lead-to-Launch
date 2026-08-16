"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PhaseShell } from "./PhaseShell";
import { Loader2, MapPin, Phone, Star, Globe, MessageCircle, Mail, Upload, FileText } from "lucide-react";
import type { Lead, ScrapeInput } from "@/lib/types";
import { toast } from "sonner";

const LeadMap = dynamic(() => import("./LeadMap"), { ssr: false });

// Common local-business niches to pick from, based on what actually works well for
// website-building outreach (clear services, local search intent, usually under-served
// online). "Custom" lets you type anything else Apify's Google Maps search can find.
const NICHE_PRESETS = [
  { value: "Beauty Salon", label: "Beauty Salon" },
  { value: "Barber Shop", label: "Barber Shop" },
  { value: "Dental Clinic", label: "Dental Clinic" },
  { value: "Restaurant", label: "Restaurant" },
  { value: "Gym", label: "Gym / Fitness Studio" },
  { value: "Spa", label: "Spa" },
  { value: "Yoga Studio", label: "Yoga Studio" },
  { value: "Cafe", label: "Cafe" },
  { value: "custom", label: "Custom (type your own)" },
];

export function Phase1Scrape({
  leads,
  setLeads,
  onNext,
  onPrev,
}: {
  leads: Lead[];
  setLeads: (l: Lead[]) => void;
  onNext: () => void;
  onPrev?: () => void;
}) {
  const [input, setInput] = useState<ScrapeInput>({ niche: "Beauty Salon", city: "Karnataka, India", count: 50 });
  const [nicheChoice, setNicheChoice] = useState<string>("Beauty Salon");
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ done: 0, total: 0, found: 0 });
  const [uploadSummary, setUploadSummary] = useState<{ rows: number; withPhone: number; withWebsite: number; mapped: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function runScrape() {
    setLoading(true);
    setLeads([]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");
      // Stagger in for visual drama
      for (let i = 0; i < data.leads.length; i++) {
        await new Promise((r) => setTimeout(r, 80));
        setLeads(data.leads.slice(0, i + 1));
      }
      toast.success(`${data.leads.length} leads scraped from ${input.city}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Looks up real phone/address/rating for leads that don't have them yet — one Google
  // Maps search per business name, via the real /api/enrich route. Never fills a lead with
  // a guess: whatever Apify doesn't find stays blank, and the summary toast reports the
  // real found-vs-not-found count rather than implying everything worked.
  async function enrichLeads() {
    const targets = leads.filter((l) => !l.phone);
    if (targets.length === 0) {
      toast.info("Every lead already has a phone number on file.");
      return;
    }
    setEnriching(true);
    setEnrichProgress({ done: 0, total: targets.length, found: 0 });
    let found = 0;
    const updated = [...leads];
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      try {
        const res = await fetch("/api/enrich", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: target.name, region: target.city }),
        });
        const data = await res.json();
        if (data.found) {
          found++;
          const idx = updated.findIndex((l) => l.id === target.id);
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              phone: data.phone ?? updated[idx].phone,
              whatsapp: data.phone ?? updated[idx].whatsapp,
              address: data.address ?? updated[idx].address,
              website: data.website ?? updated[idx].website,
              rating: data.rating ?? updated[idx].rating,
              reviewsCount: data.reviewsCount ?? updated[idx].reviewsCount,
              lat: data.locationKnown ? data.lat : updated[idx].lat,
              lng: data.locationKnown ? data.lng : updated[idx].lng,
              locationKnown: data.locationKnown || updated[idx].locationKnown,
            };
          }
        }
      } catch {
        // one failed lookup shouldn't stop the rest — it just stays "needs lookup"
      }
      setEnrichProgress({ done: i + 1, total: targets.length, found });
      setLeads([...updated]);
      // small delay between calls so we're not hammering the Apify API
      await new Promise((r) => setTimeout(r, 300));
    }
    setEnriching(false);
    toast.success(`Found real details for ${found} of ${targets.length} leads. ${targets.length - found} still need manual lookup.`);
  }

  // Flexible column matching — works with your original Drive export (business_name,
  // business_naics_description, etc.) or a differently-named CSV, as long as the intent is
  // clear. Any field with no matching column is left blank rather than guessed.
  const COLUMN_ALIASES: Record<string, string[]> = {
    name: ["business_name", "name", "company", "company_name", "business"],
    website: ["business_website", "website", "url", "site"],
    category: ["business_naics_description", "category", "niche", "industry", "type"],
    region: ["business_region", "region", "city", "location"],
    country: ["business_country_name", "country"],
    phone: ["phone", "phone_number", "mobile", "contact", "contact_number"],
    address: ["address", "business_address", "street_address"],
    rating: ["rating", "google_rating", "stars"],
    reviewsCount: ["reviews", "reviewscount", "review_count", "reviews_count", "num_reviews"],
    employeeRange: ["business_number_of_employees_range", "employees", "employee_range", "company_size"],
    revenueRange: ["business_yearly_revenue_range", "revenue", "revenue_range"],
    id: ["business_id", "id"],
  };

  function detectColumn(headers: string[], aliases: string[]): string | null {
    // Normalize spaces/hyphens to underscores so "Company Name", "company-name", and
    // "company_name" all match the same alias — real-world CSV exports use all three.
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[\s-]+/g, "_");
    const normalizedHeaders = headers.map(normalize);
    for (const alias of aliases) {
      const idx = normalizedHeaders.indexOf(normalize(alias));
      if (idx !== -1) return headers[idx];
    }
    return null;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const colMap: Record<string, string | null> = {};
        for (const field of Object.keys(COLUMN_ALIASES)) {
          colMap[field] = detectColumn(headers, COLUMN_ALIASES[field]);
        }
        if (!colMap.name) {
          toast.error("Couldn't find a business-name column in this file. Check the header row.");
          return;
        }

        const rows = results.data as Record<string, string>[];
        const parsed: Lead[] = rows
          .map((row, i): Lead | null => {
            const name = colMap.name ? row[colMap.name]?.trim() : "";
            if (!name) return null;
            const rating = colMap.rating ? parseFloat(row[colMap.rating]) : NaN;
            const reviewsCount = colMap.reviewsCount ? parseInt(row[colMap.reviewsCount], 10) : NaN;
            return {
              id: colMap.id && row[colMap.id] ? `csv-${row[colMap.id].slice(0, 8)}` : `csv-${String(i + 1).padStart(3, "0")}`,
              name,
              category: (colMap.category ? row[colMap.category] : input.niche) || input.niche,
              address: colMap.address ? (row[colMap.address] || "") : "",
              city: (colMap.region ? row[colMap.region] : input.city) || input.city,
              website: colMap.website ? (row[colMap.website]?.trim() || undefined) : undefined,
              phone: colMap.phone ? (row[colMap.phone]?.trim() || undefined) : undefined,
              whatsapp: colMap.phone ? (row[colMap.phone]?.trim() || undefined) : undefined,
              rating: !isNaN(rating) ? rating : undefined,
              reviewsCount: !isNaN(reviewsCount) ? reviewsCount : undefined,
              lat: 0,
              lng: 0,
              locationKnown: false, // CSV uploads never include real coordinates unless the file has them explicitly — not attempted here
              source: "drive_csv" as const,
              employeeRange: colMap.employeeRange ? row[colMap.employeeRange] : undefined,
              revenueRange: colMap.revenueRange ? row[colMap.revenueRange] : undefined,
            } satisfies Lead;
          })
          .filter((l): l is Lead => l !== null);

        if (parsed.length === 0) {
          toast.error("No usable rows found in this file.");
          return;
        }

        setLeads(parsed);
        setUploadSummary({
          rows: parsed.length,
          withPhone: parsed.filter((l) => l.phone).length,
          withWebsite: parsed.filter((l) => l.website).length,
          mapped: Object.entries(colMap).filter(([, v]) => v).map(([k, v]) => `${k} ← "${v}"`),
        });
        toast.success(`Loaded ${parsed.length} leads from ${file.name}`);
      },
      error: (err) => toast.error(`Couldn't read file: ${err.message}`),
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <PhaseShell
      title="Phase 1 — Scrape leads"
      subtitle="Pull local businesses from Google Maps. We capture contact, reviews, photos, and location to score conversion potential."
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={leads.length === 0}
      nextLabel="Audit these leads"
    >
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="niche" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Niche</Label>
              <Select
                value={nicheChoice}
                onValueChange={(v) => {
                  if (!v) return;
                  setNicheChoice(v);
                  if (v !== "custom") setInput({ ...input, niche: v });
                }}
              >
                <SelectTrigger id="niche" className="w-full h-10 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NICHE_PRESETS.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {nicheChoice === "custom" && (
                <Input
                  autoComplete="off"
                  value={input.niche}
                  onChange={(e) => setInput({ ...input, niche: e.target.value })}
                  placeholder="e.g. Physiotherapy Clinic"
                  className="h-10 text-base mt-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Location</Label>
              <Input id="city" autoComplete="off" value={input.city} onChange={(e) => setInput({ ...input, city: e.target.value })} placeholder="e.g. Bandra, Mumbai" className="h-10 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Count</Label>
              <Input id="count" type="number" inputMode="numeric" min={1} max={50} value={input.count} onChange={(e) => setInput({ ...input, count: Number(e.target.value) })} className="h-10 text-base font-mono tabular-nums" />
              <p className="text-[11px] text-muted-foreground">Max 25 for free Apify tier.</p>
            </div>
            <Button onClick={runScrape} disabled={loading} className="w-full h-11 transition-transform duration-150 active:scale-[0.98]">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scraping...</> : "Scrape leads"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.12em]"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>

            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 transition-transform duration-150 active:scale-[0.98]"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || enriching}
            >
              <Upload className="h-4 w-4 mr-2" /> Upload your own lead list (.csv)
            </Button>
            {uploadSummary && (
              <div className="rounded-md border border-border bg-muted/40 p-2.5 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-medium"><FileText className="h-3.5 w-3.5" /> {uploadSummary.rows} leads loaded from file</div>
                <div className="text-muted-foreground">{uploadSummary.withPhone} have a phone number · {uploadSummary.withWebsite} have a website on file</div>
                <div className="text-muted-foreground">Columns matched: {uploadSummary.mapped.join(", ") || "name only"}</div>
              </div>
            )}

            {leads.length > 0 && (
              <Button
                onClick={enrichLeads}
                disabled={enriching || loading}
                variant="outline"
                className="w-full h-11 transition-transform duration-150 active:scale-[0.98]"
              >
                {enriching
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Looking up {enrichProgress.done}/{enrichProgress.total}...</>
                  : `Find real details (Google Maps) — ${leads.filter((l) => !l.phone).length} need lookup`}
              </Button>
            )}
            {enriching && (
              <p className="text-[11px] text-muted-foreground text-center">
                Found {enrichProgress.found} so far — the rest will stay marked &quot;needs lookup&quot; if Google Maps has no match.
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Stat label="Found" value={leads.length} />
              <Stat label="With phone" value={leads.filter((l) => l.phone).length} />
              <Stat label="No site" value={leads.filter((l) => !l.website).length} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Live map</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadMap leads={leads} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Site</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {leads.map((l, i) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-b border-border"
                    >
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {l.address}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-0.5">
                          {l.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {l.phone}</span>}
                          {l.whatsapp && <span className="flex items-center gap-1 text-[color:var(--accent-foreground)]"><MessageCircle className="h-3 w-3" /> WhatsApp</span>}
                          {l.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {l.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-[color:var(--chart-4)] text-[color:var(--chart-4)]" />
                          <span className="font-medium">{l.rating?.toFixed(1)}</span>
                          <span className="text-muted-foreground text-xs">({l.reviewsCount})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {l.website ? (
                          <Badge variant="secondary" className="text-xs font-normal"><Globe className="h-3 w-3 mr-1" /> Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-normal text-[color:var(--destructive)] border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/5">No site</Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            {leads.length === 0 && !loading && (
              <div className="text-center py-12 text-sm text-muted-foreground">Run a scrape to populate leads</div>
            )}
          </div>
        </CardContent>
      </Card>
    </PhaseShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="font-display text-xl tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
