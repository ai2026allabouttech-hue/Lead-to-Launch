import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Lead, AuditResult } from "@/lib/types";

const PSI_KEY = process.env.GOOGLE_PAGESPEED_KEY;

const SEED_FILE = "leads-drive.json";

async function loadSeedAudits(): Promise<Record<string, AuditResult>> {
  const p = path.join(process.cwd(), "data", SEED_FILE);
  const raw = await fs.readFile(p, "utf-8");
  const json = JSON.parse(raw);
  // leads-drive.json has no pre-written audits (there's no real speed/rating data to seed with) —
  // every lead falls through to the honest fallback logic below instead.
  return (json.audits ?? {}) as Record<string, AuditResult>;
}

async function pagespeed(url: string): Promise<{ score: number; loadTimeMs: number }> {
  if (!PSI_KEY) return { score: 0, loadTimeMs: 0 };
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=PERFORMANCE&key=${PSI_KEY}`;
  const res = await fetch(endpoint);
  if (!res.ok) return { score: 0, loadTimeMs: 0 };
  const j = await res.json();
  const score = Math.round((j.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
  const lcp = j.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue ?? 0;
  return { score, loadTimeMs: Math.round(lcp) };
}

export async function POST(req: Request) {
  const { lead } = (await req.json()) as { lead: Lead };

  // Seed has rich pre-written audits for demo — use if id matches
  const seed = await loadSeedAudits();
  if (seed[lead.id]) {
    return NextResponse.json({ audit: seed[lead.id] });
  }

  // Fallback: real PageSpeed call or empty result
  const hasWebsite = !!lead.website;
  let score = 0;
  let loadTimeMs = 0;
  if (hasWebsite) {
    const r = await pagespeed(lead.website!);
    score = r.score;
    loadTimeMs = r.loadTimeMs;
  }

  // Reviews/rating genuinely unknown (e.g. a lead list with only names) vs. confirmed zero —
  // these must be treated differently so we never state a made-up number as fact.
  const reviewsUnverified = lead.reviewsCount === undefined || lead.reviewsCount === null;

  const gaps: string[] = [];
  if (!hasWebsite) gaps.push("No website at all");
  if (hasWebsite && PSI_KEY && score < 50) gaps.push(`${score} PageSpeed (mobile)`);
  if (hasWebsite && loadTimeMs > 4000) gaps.push(`${(loadTimeMs / 1000).toFixed(1)}s load time`);
  if (!lead.whatsapp) gaps.push("No WhatsApp click-to-chat");
  if (reviewsUnverified) gaps.push("Rating/reviews not verified — confirm on Google before outreach");
  gaps.push("No online booking", "No schema markup", "Weak local SEO");

  // Only estimate a revenue-impact number when we have a real review count to base it on.
  // With no review data, a specific rupee figure would look like fact when it's a guess —
  // so we skip it rather than quote a number that could end up in front of a real business owner.
  const estLostRevenuePerMonth = reviewsUnverified
    ? 0
    : Math.max(20000, (lead.reviewsCount ?? 0) * 400 + (hasWebsite ? 0 : 30000));

  const biggestGap = hasWebsite
    ? loadTimeMs > 0
      ? `Site loads in ${(loadTimeMs / 1000).toFixed(1)}s. Modern build fixes this overnight.`
      : `Outdated site with no booking flow. A modern build with WhatsApp booking converts visitors into customers.`
    : reviewsUnverified
      ? `No website on file, and review count/rating aren't in the source data — worth a quick Google check before reaching out.`
      : `${lead.reviewsCount} reviews, zero web presence. Losing booking-ready customers to businesses that show up on Google search.`;

  const audit: AuditResult = {
    leadId: lead.id,
    pageSpeedScore: score,
    hasWebsite,
    mobileFriendly: PSI_KEY ? score > 60 : true,
    https: hasWebsite ? lead.website!.startsWith("https") : false,
    hasSchema: false,
    loadTimeMs,
    gaps,
    biggestGap,
    estLostRevenuePerMonth,
  };
  return NextResponse.json({ audit });
}
