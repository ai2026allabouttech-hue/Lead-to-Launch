"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { MessageCircle, Mail, Camera, Copy, ExternalLink, Sparkles } from "lucide-react";
import type { RankedLead, OutreachChannel, OutreachLanguage } from "@/lib/types";
import { toast } from "sonner";

export function Phase5Outreach({
  selected,
  onPrev,
}: {
  selected: RankedLead | null;
  onPrev: () => void;
}) {
  const [channel, setChannel] = useState<OutreachChannel>("whatsapp");
  const [lang, setLang] = useState<OutreachLanguage>("hinglish");
  const [message, setMessage] = useState("");
  const [followUp, setFollowUp] = useState("");

  useEffect(() => {
    if (!selected) return;
    const m = buildOutreach(selected, channel, lang);
    setMessage(m.first);
    setFollowUp(m.followUp);
  }, [selected, channel, lang]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function openChannel() {
    if (!selected) return;
    if (channel === "whatsapp" && selected.whatsapp) {
      const num = selected.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, "_blank");
    } else if (channel === "email" && selected.email) {
      const subject = lang === "hinglish" ? "Aapke business ke liye ek website demo banayi hai" : "Built a website demo for your business";
      window.open(`mailto:${selected.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, "_blank");
    } else if (channel === "instagram") {
      window.open(`https://instagram.com/`, "_blank");
    } else {
      toast.error("No contact for this channel");
    }
  }

  if (!selected) {
    return (
      <PhaseShell
        title="Phase 5 — Outreach"
        subtitle="Hinglish-first by default — converts 3x better in India. Built-in 5-day follow-up."
        onPrev={onPrev}
      >
        <IncompleteState
          title="No lead selected yet"
          description="Outreach drafts are tailored to a specific lead — picking up name, biggest gap, review count, and reachable channels. Run earlier phases and select a prospect to see WhatsApp, email, and Instagram drafts here."
          prevPhaseLabel="Rank"
          onPrev={onPrev}
        />
      </PhaseShell>
    );
  }

  const channels: { id: OutreachChannel; label: string; icon: typeof MessageCircle; enabled: boolean }[] = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, enabled: !!selected.whatsapp },
    { id: "email", label: "Email", icon: Mail, enabled: !!selected.email },
    { id: "instagram", label: "Instagram", icon: Camera, enabled: true },
  ];

  return (
    <PhaseShell title="Phase 5 — Outreach" subtitle="Hinglish-first by default — converts 3x better in India. Built-in 5-day follow-up." onPrev={onPrev}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Sending to</div>
          <div className="font-display text-2xl mt-1">{selected.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="lang" className="text-sm">English</Label>
            <Switch id="lang" checked={lang === "hinglish"} onCheckedChange={(c) => setLang(c ? "hinglish" : "english")} />
            <Label htmlFor="lang" className="text-sm">Hinglish</Label>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {channels.map(({ id, label, icon: Icon, enabled }) => (
          <Button
            key={id}
            variant={channel === id ? "default" : "outline"}
            size="sm"
            disabled={!enabled}
            onClick={() => setChannel(id)}
          >
            <Icon className="h-4 w-4 mr-2" /> {label}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>First message</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copy(message)}><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</Button>
              <Button size="sm" onClick={openChannel}><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Send</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
            />
            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Hook: personal · Pain: their biggest gap · Demo: live link · CTA: low-friction yes/no
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day-3 follow-up (auto-draft)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
            />
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => copy(followUp)}><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy follow-up</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 bg-accent/40 border-accent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-base">✓</div>
            <div>
              <div className="font-medium tracking-tight">Pipeline complete</div>
              <div className="text-sm text-muted-foreground">Lead → audit → ranked → site → outreach. Repeat for next prospect in Phase 3.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PhaseShell>
  );
}

function buildOutreach(l: RankedLead, channel: OutreachChannel, lang: OutreachLanguage): { first: string; followUp: string } {
  const ownerName = l.name.includes("Dr.") ? l.name.split(",")[0].replace(/['s].*/, "").trim() : "there";
  const niche = l.category.toLowerCase();
  const demoUrl = `[your-demo-link]`;

  // Only claim a specific rating/review count when we actually have one — never invent a number
  // and put it in front of a real business owner.
  const ratingKnown = l.rating != null && l.reviewsCount != null;
  const ratingClauseHi = ratingKnown
    ? `${l.rating}★ aur ${l.reviewsCount}+ reviews mein aayi 🔥`
    : `Karnataka ke top listings mein short-listed hui 🔥`;
  const ratingClauseEn = ratingKnown
    ? `${l.rating}★ with ${l.reviewsCount}+ Google reviews.`
    : `showed up as a strong local prospect in our research.`;
  const ratingParenHi = ratingKnown ? `${l.rating}★, ${l.reviewsCount}+ reviews` : `short-listed from local business data`;
  const ratingParenEn = ratingKnown ? `${l.rating}★, ${l.reviewsCount}+ reviews` : `short-listed from local business data`;

  // Same rule for the revenue-impact number: only state it when the audit actually estimated one.
  const revenueKnown = l.audit.estLostRevenuePerMonth > 0;
  const revenueClauseHi = revenueKnown
    ? `Iska monthly impact roughly ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")} hai (Google search volume ke basis pe).`
    : `Exact monthly impact abhi calculate nahi kiya — lekin bina website ke naye customers miss hona common hai.`;
  const revenueClauseEn = revenueKnown
    ? `is costing roughly ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/month in missed bookings.`
    : `is likely costing new bookings each month — happy to pull exact numbers once we confirm your review data.`;

  if (lang === "hinglish") {
    if (channel === "whatsapp") {
      return {
        first: `Hi ${ownerName} 👋

${l.city} mein ${niche} options dekh raha tha aur aapki ${l.name} sabse top ratings mein aayi — ${ratingClauseHi}

Ek baat noticed ki: ${l.audit.biggestGap}

Iska ek solution banaya hai — aapke business ke liye ek FREE website demo bana di hai. WhatsApp booking, Google reviews, services, sab ready.

Live demo dekhiye (30 seconds):
${demoUrl}

Pasand aaye toh launch karwa denge. Nahi toh no problem — demo aapke paas free hi rahega.

Reply karein "YES" agar interested?`,
        followUp: `Hi ${ownerName}, kal jo demo bheja tha — dekha aapne?

Quick recap: ${l.audit.biggestGap.split(".")[0]}.

${revenueClauseHi}

Demo abhi bhi live hai:
${demoUrl}

5 minute call kar sakte hain to walk through? Bas batao kab free ho.`,
      };
    }
    if (channel === "email") {
      return {
        first: `Subject: Aapki ${l.name} ke liye ek website demo (free, 30 sec dekhiye)

Hi ${ownerName},

${l.city} mein ${niche} services research kar raha tha. ${l.name} top results mein aayi — ${ratingParenHi}.

Lekin ek gap noticed kiya: ${l.audit.biggestGap}

Aapke business ke liye ek live website demo banayi hai. Saari information already filled in — services, location, WhatsApp booking, Google reviews integration.

Demo: ${demoUrl}

30 seconds lagega dekhne mein. Pasand aaye toh launch karwa denge — full price ₹15,000 (one-time), zero monthly fees.

Reply with "YES" agar interested ho, ya "NO" agar relevant nahi — dono works.

Best,
[Your Name]`,
        followUp: `Subject: Re: ${l.name} website demo

Hi ${ownerName},

Pichli email pe quick check-in. Demo abhi bhi live hai: ${demoUrl}

Conservative note: ${l.audit.biggestGap.split(".")[0].toLowerCase()} — ${revenueClauseHi}

Worth a 5-min call?

Best,
[Your Name]`,
      };
    }
    return {
      first: `Hi! 🙏 ${l.name} ke liye ek website demo banayi hai — ${l.audit.biggestGap} solve karne ke liye. ${demoUrl} pe live preview. Pasand aaye toh DM!`,
      followUp: `Hey, kal jo website demo bheja tha — koi feedback? Demo: ${demoUrl} | 5 min call set kar sakte hain?`,
    };
  }

  // English
  if (channel === "whatsapp") {
    return {
      first: `Hi ${ownerName} 👋

Was researching ${niche} businesses in ${l.city} and ${l.name} stood out — ${ratingClauseEn}

Spotted one gap though: ${l.audit.biggestGap}

So I built you a free website demo with WhatsApp booking, Google reviews integration, and services. All pre-filled with your info.

30-second preview: ${demoUrl}

If you like it, we launch it. If not, the demo is yours to keep — free.

Reply "YES" if interested?`,
      followUp: `Hi ${ownerName}, following up on the demo from a couple of days ago: ${demoUrl}

The biggest gap I shared (${l.audit.biggestGap.split(".")[0]}) ${revenueClauseEn}

Worth a quick 5-min call to walk through?`,
    };
  }
  if (channel === "email") {
    return {
      first: `Subject: Built ${l.name} a website demo — 30 sec preview

Hi ${ownerName},

I was researching ${niche} businesses in ${l.city}. ${l.name} stood out (${ratingParenEn}).

But I noticed: ${l.audit.biggestGap}

So I built a free demo website for your business, pre-filled with services, location, WhatsApp booking, and Google reviews.

Demo: ${demoUrl}

If you like it, launch is ₹15,000 one-time, zero monthly. If not, demo is yours.

Reply "YES" or "NO" — both work.

Best,
[Your Name]`,
      followUp: `Subject: Re: ${l.name} website demo

Hi ${ownerName},

Quick check-in. Demo still live: ${demoUrl}

Conservative note: the gap above ${revenueClauseEn}

5-min call?

Best,
[Your Name]`,
    };
  }
  return {
    first: `Hey! Built a website demo for ${l.name} to fix one gap (${l.audit.biggestGap.split(".")[0]}). Preview: ${demoUrl}. DM if interested!`,
    followUp: `Hi! Following up on the demo: ${demoUrl}. 5-min call?`,
  };
}
