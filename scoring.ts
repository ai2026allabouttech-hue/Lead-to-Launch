import type { Lead, AuditResult, RankedLead } from "./types";

const HIGH_FIT_NICHES = ["dentist", "salon", "clinic", "spa", "gym", "restaurant", "cafe", "lawyer", "doctor", "coaching"];

export function scoreLead(lead: Lead, audit: AuditResult): RankedLead {
  const noOrBadSite = !audit.hasWebsite ? 25 : audit.pageSpeedScore < 50 ? 20 : audit.pageSpeedScore < 70 ? 10 : 0;
  const reviews = lead.reviewsCount ?? 0;
  const reviewVolume = Math.min(20, Math.round(reviews / 5));
  const rating = (lead.rating ?? 0) >= 4 ? 15 : (lead.rating ?? 0) >= 3.5 ? 8 : 0;
  const recency = reviews > 20 ? 10 : reviews > 5 ? 5 : 0;
  const reachable = (lead.phone ? 5 : 0) + (lead.whatsapp ? 5 : 0) + (lead.email ? 5 : 0);
  const fit = HIGH_FIT_NICHES.some((n) => lead.category.toLowerCase().includes(n)) ? 15 : 8;
  const score = noOrBadSite + reviewVolume + rating + recency + reachable + fit;
  return {
    ...lead,
    audit,
    score: Math.min(100, score),
    scoreBreakdown: {
      noOrBadSite,
      reviewVolume,
      rating,
      recency,
      reachable,
      industryFit: fit,
    },
  };
}
