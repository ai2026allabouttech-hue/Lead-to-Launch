"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { Copy, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import type { RankedLead } from "@/lib/types";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "lovable", label: "Lovable", url: "https://lovable.dev" },
  { id: "claude-code", label: "Claude Code", url: "https://claude.com/claude-code" },
  { id: "bolt", label: "Bolt.new", url: "https://bolt.new" },
  { id: "codex", label: "Codex", url: "https://chat.openai.com" },
];

export function Phase4Build({
  selected,
  onNext,
  onPrev,
}: {
  selected: RankedLead | null;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [platform, setPlatform] = useState("lovable");
  const [prompt, setPrompt] = useState("");
  const [typed, setTyped] = useState("");
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    if (!selected) return;
    const p = buildPrompt(selected, platform);
    setPrompt(p);
  }, [selected, platform]);

  useEffect(() => {
    setTyped("");
    if (!prompt) return;
    let i = 0;
    const id = setInterval(() => {
      i += 8;
      setTyped(prompt.slice(0, i));
      if (i >= prompt.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [prompt]);

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied. Paste into " + PLATFORMS.find((p) => p.id === platform)?.label);
  }

  function openPlatform() {
    const url = PLATFORMS.find((p) => p.id === platform)?.url;
    if (url) window.open(url, "_blank");
  }

  function simulateBuild() {
    setBuilding(true);
    setTimeout(() => {
      setBuilding(false);
      toast.success("Demo site ready. Preview loaded.");
    }, 1800);
  }

  if (!selected) {
    return (
      <PhaseShell
        title="Phase 4 — Generate website"
        subtitle="Pick a platform. We craft a battle-tested prompt with brand, structure, sections, and SEO baked in."
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled
        nextLabel="Draft outreach"
      >
        <IncompleteState
          title="No lead selected yet"
          description="Run scrape and audit, then pick the highest-scoring prospect in Phase 3. We'll generate a complete website prompt (Lovable / Bolt / Claude Code / Codex) plus a live preview here."
          prevPhaseLabel="Rank"
          onPrev={onPrev}
        />
      </PhaseShell>
    );
  }

  return (
    <PhaseShell
      title="Phase 4 — Generate website"
      subtitle={`Pick a platform. We craft a battle-tested prompt with brand, structure, sections, and SEO baked in.`}
      onPrev={onPrev}
      onNext={onNext}
      nextLabel="Draft outreach"
    >
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Selected lead</div>
          <div className="font-display text-2xl mt-1">{selected.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{selected.address}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={openPlatform}><ExternalLink className="h-4 w-4 mr-2" /> Open</Button>
          <Button onClick={copyPrompt}><Copy className="h-4 w-4 mr-2" /> Copy prompt</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Generated prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono bg-muted/30 rounded-md p-4 max-h-[520px] overflow-y-auto border border-border">
              {typed}<span className="animate-pulse">▌</span>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Live preview</CardTitle>
            <Button size="sm" variant="outline" onClick={simulateBuild} disabled={building}>
              {building ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Building</> : <><Sparkles className="h-3.5 w-3.5 mr-2" /> Build site</>}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-border h-[520px]">
              <iframe
                title="Preview"
                srcDoc={demoSiteHtml(selected)}
                className="w-full h-full bg-[#f5efe6]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PhaseShell>
  );
}

function buildPrompt(l: RankedLead, platform: string): string {
  const name = l.name;
  const niche = l.category;
  const phoneKnown = !!l.phone;
  const phone = l.phone ?? null;
  const whatsapp = l.whatsapp ?? l.phone ?? null;
  const addrKnown = !!l.address;
  const addr = l.address || null;
  const ratingKnown = l.rating != null && l.reviewsCount != null;
  const rating = l.rating;
  const reviews = l.reviewsCount;
  const gap = l.audit.biggestGap;

  const contactLines = [
    `Address: ${addrKnown ? addr : "NOT PROVIDED — leave a clearly marked [ADDRESS PLACEHOLDER], do not invent one"}`,
    `Phone: ${phoneKnown ? phone : "NOT PROVIDED — leave a clearly marked [PHONE PLACEHOLDER], do not invent one"}`,
    `WhatsApp: ${whatsapp ? whatsapp : "NOT PROVIDED — hide the WhatsApp button until a real number is added"}`,
    `Google rating: ${ratingKnown ? `${rating}★ (${reviews} reviews)` : "NOT VERIFIED — do not show a star rating or review count anywhere on the site until this is confirmed"}`,
  ].join("\n");

  return `You are building a high-converting local-business website for an Indian ${niche}.

# BUSINESS
Name: ${name}
Category: ${niche}
${contactLines}
Biggest current gap: ${gap}

# DESIGN
- Mobile-first (90% of Indian traffic is mobile). Hero CTA visible above fold on 375px width.
- Premium local-business aesthetic suited to a ${niche}. Off-white base + one deep accent colour. Generous whitespace.
- Inter or DM Sans font. Large H1 (48-64px desktop, 32px mobile).
- Trust signals everywhere: ratings, reviews, "years in practice", credentials — ONLY the ones marked as provided above. Never invent a number for anything marked NOT PROVIDED/NOT VERIFIED.
- Floating WhatsApp button (bottom-right) on every page, only if a WhatsApp number was provided above. ${whatsapp ? `Click → wa.me/${whatsapp.replace(/\D/g, "")}` : "Omit this button entirely for now."}
- Click-to-call phone in header, only if a phone number was provided above.${phoneKnown ? ` tel:${phone!.replace(/\s/g, "")}` : ""}

# SECTIONS (in order)
1. Hero: Business name + 1-line promise + "Book on WhatsApp" CTA (or "Enquire" CTA if no WhatsApp number yet) + rating badge only if rating was provided above
2. Trust strip: "${ratingKnown ? `${rating}★ on Google · ${reviews}+ reviews · ` : ""}${l.yearsInBusiness ? `${l.yearsInBusiness}+ years in ` : "serving "}${l.city.split(",")[0]}"
3. Services grid: 6 cards with icons — pick the 6 most-searched services for a ${niche} in India
4. About + owner bio: 2-col, photo placeholder + credentials
5. Gallery/portfolio placeholder (3x2 grid, "Coming soon" overlay)
6. Reviews carousel: only include this section if a rating/review count was provided above. Otherwise skip it — do not fill it with placeholder reviews.
7. FAQ accordion: 5 questions a first-time ${niche} customer in India actually asks (pricing, timings, first visit, payments)
8. Location: ${addrKnown ? `Google Maps embed of ${addr} + business hours table + directions CTA` : "Skip the map embed until a real address is added — show a business-hours table only"}
9. Footer: WhatsApp/Phone/Address only where marked as provided above + Hours + social icons (Instagram, Google)

# SEO & TECHNICAL
- HTML lang="en-IN"
- Meta: "${name} | ${niche} in ${l.city} | Book on WhatsApp"
- LocalBusiness schema markup (pick the closest @type for a ${niche}) in JSON-LD — only include the fields marked as provided above; omit address/telephone/aggregateRating fields that are NOT PROVIDED rather than filling them with placeholders
- All images <img loading="lazy" alt="...">
- Lighthouse mobile 90+: minify, no blocking JS, preload hero image
- HTTPS, semantic HTML, accessible color contrast

# COPY TONE
Warm, calm, confident. Hindi/Hinglish allowed for trust phrases ("zaroorat padne pe call kariye"). Avoid jargon. Address common customer hesitations (cost, quality, trust) directly.

# CTA HIERARCHY
Primary: WhatsApp book (or Enquire if no WhatsApp yet). Secondary: Call (if phone provided). Tertiary: Google Maps directions (if address provided).

${
  platform === "lovable" || platform === "bolt"
    ? `OUTPUT: Single React + Tailwind page. No backend. Use placeholder images from unsplash.com (search: ${niche.toLowerCase()}, indian local business).`
    : platform === "claude-code"
      ? "OUTPUT: Next.js 15 app with app router, Tailwind, shadcn. Single landing page route. Include Suspense boundaries."
      : "OUTPUT: Static HTML + Tailwind CDN. Single index.html, self-contained."
}

Generate now. Then list 3 sentences I can use to show the owner why this beats their current ${l.audit.hasWebsite ? "outdated site" : "Google listing only"}.`;
}

function demoSiteHtml(l: RankedLead): string {
  const wa = (l.whatsapp ?? l.phone ?? "919999999999").replace(/\D/g, "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${l.name}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{font-family:ui-serif,Georgia,'Times New Roman',serif;background:#f5efe6;color:#2c2620}h1,h2,.sans{font-family:ui-sans-serif,system-ui,sans-serif}</style>
</head><body>
<header class="border-b border-stone-200 bg-[#faf6ee]"><div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><div class="font-medium tracking-tight text-stone-800">${l.name}</div><a href="tel:${(l.phone ?? "").replace(/\s/g, "")}" class="text-sm text-stone-600 sans">${l.phone ?? ""}</a></div></header>
<section><div class="max-w-5xl mx-auto px-6 py-20 sm:py-28"><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 sans">${l.category} · ${l.city}</div><h1 class="text-4xl sm:text-6xl font-medium mt-4 leading-[1.05] tracking-tight text-stone-900">A name ${l.city.split(",")[0]}<br/>has trusted for years.<br/><span class="italic text-stone-500">Now online.</span></h1><p class="mt-6 text-lg text-stone-600 max-w-xl leading-relaxed">${l.rating} on Google · ${l.reviewsCount} reviews. Book in under a minute on WhatsApp — no calls, no waiting.</p><div class="mt-8 flex gap-3 sans"><a href="https://wa.me/${wa}" class="bg-stone-900 text-stone-50 font-medium px-7 py-3.5 rounded-full text-sm tracking-wide hover:bg-stone-700 transition">Book on WhatsApp →</a><a href="tel:${(l.phone ?? "").replace(/\s/g, "")}" class="border border-stone-300 text-stone-700 px-7 py-3.5 rounded-full text-sm tracking-wide">Call us</a></div></div></section>
<section class="bg-[#ede4d3] border-y border-stone-200"><div class="max-w-5xl mx-auto px-6 py-14 grid sm:grid-cols-3 gap-8 text-center"><div><div class="text-4xl font-medium tracking-tight text-stone-900">${l.reviewsCount}+</div><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 mt-2 sans">Happy customers</div></div><div><div class="text-4xl font-medium tracking-tight text-stone-900">${l.rating}</div><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 mt-2 sans">Google rating</div></div><div><div class="text-4xl font-medium tracking-tight text-stone-900">${l.yearsInBusiness ?? 8}+</div><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 mt-2 sans">Years in ${l.city.split(",")[0]}</div></div></div></section>
<section class="max-w-5xl mx-auto px-6 py-16"><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 sans">Services</div><h2 class="text-3xl font-medium tracking-tight text-stone-900 mt-2">What we do well.</h2><div class="grid sm:grid-cols-3 gap-px bg-stone-200 mt-8 border border-stone-200">${["Service one","Service two","Service three","Service four","Service five","Service six"].map((s)=>`<div class="bg-[#faf6ee] p-6"><div class="font-medium tracking-tight text-stone-900">${s}</div><div class="text-xs text-stone-500 mt-1.5 sans">Reliable · modern · affordable</div></div>`).join("")}</div></section>
<section class="max-w-5xl mx-auto px-6 py-16 border-t border-stone-200"><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 sans">Visit us</div><h2 class="text-3xl font-medium tracking-tight text-stone-900 mt-2">${l.address}</h2><div class="mt-6 rounded-lg overflow-hidden bg-stone-200/60 border border-stone-300 h-64 flex items-center justify-center text-stone-500 sans text-sm">[Google Maps embed]</div></section>
<a href="https://wa.me/${wa}" class="fixed bottom-6 right-6 bg-stone-900 text-stone-50 rounded-full w-14 h-14 flex items-center justify-center text-xl shadow-md">○</a>
<footer class="bg-[#ede4d3] border-t border-stone-200 sans"><div class="max-w-5xl mx-auto px-6 py-8 text-xs text-stone-500 flex justify-between"><span>© ${l.name}</span><span>${l.address}</span></div></footer>
</body></html>`;
}
