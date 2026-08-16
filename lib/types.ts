export type Lead = {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewsCount?: number;
  lat: number;
  lng: number;
  photosCount?: number;
  yearsInBusiness?: number;
  /** false = lat/lng are placeholder 0,0 — real coordinates not available in source data */
  locationKnown?: boolean;
  /** where this lead came from — used to skip fabricating data we don't have */
  source?: "apify" | "seed" | "drive_csv";
  employeeRange?: string;
  revenueRange?: string;
};

export type AuditResult = {
  leadId: string;
  pageSpeedScore: number;
  hasWebsite: boolean;
  mobileFriendly: boolean;
  https: boolean;
  hasSchema: boolean;
  loadTimeMs: number;
  gaps: string[];
  biggestGap: string;
  estLostRevenuePerMonth: number;
};

export type RankedLead = Lead & {
  audit: AuditResult;
  score: number;
  scoreBreakdown: {
    noOrBadSite: number;
    reviewVolume: number;
    rating: number;
    recency: number;
    reachable: number;
    industryFit: number;
  };
};

export type ScrapeInput = {
  niche: string;
  city: string;
  count: number;
};

export type OutreachChannel = "whatsapp" | "email" | "instagram";
export type OutreachLanguage = "english" | "hinglish";
