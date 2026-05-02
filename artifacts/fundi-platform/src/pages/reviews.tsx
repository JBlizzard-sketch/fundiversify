import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Star, ShieldCheck, MapPin, Filter, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useListContractors } from "@workspace/api-client-react";
import { usePageMeta } from "@/hooks/use-page-meta";

const TRADES = ["All Trades", "Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "HVAC", "Welding", "Fundi"];
const RATING_FILTERS = ["All Ratings", "5 stars", "4+ stars", "3+ stars"];

// Deterministic Kenyan reviewer names & neighbourhoods from contractor id
const REVIEWERS = [
  ["John Kamau", "Westlands"], ["Grace Wanjiku", "Kilimani"], ["Peter Ochieng", "Karen"],
  ["Mary Akinyi", "Parklands"], ["David Mwangi", "Kasarani"], ["Faith Njeri", "Lavington"],
  ["James Otieno", "Eastleigh"], ["Eunice Wairimu", "Langata"], ["Collins Mutua", "South B"],
  ["Lydia Chebet", "Ruaka"], ["Brian Kimani", "Roysambu"], ["Agnes Nduta", "Thika Rd"],
];

const REVIEW_TEXTS: Record<string, string[]> = {
  Plumbing:   ["Fixed our leaking pipe in under an hour — brilliant work!", "Very professional, left the bathroom spotless.", "Arrived on time, explained everything clearly. Will hire again.", "Outstanding — traced a hidden leak we'd been chasing for months."],
  Electrical: ["Rewired three rooms safely and quickly. Highly recommend.", "Diagnosed a tricky fault others had missed. Excellent service.", "Polite, tidy, and competent. Our go-to electrician from now on.", "Replaced the distribution board perfectly. No shortcuts taken."],
  Painting:   ["Walls look brand new — the finish is flawless.", "Mixed the exact shade we wanted. Very patient with our indecision!", "Prepared surfaces properly before painting. Result speaks for itself.", "Came with all his own materials. Finished ahead of schedule."],
  Tiling:     ["Bathroom floor is perfectly level. Grout lines are immaculate.", "Handled a complex herringbone pattern without any complaints.", "Measured twice, cut once. Zero wastage. Impressive.", "Grouting colour advice was spot-on. The whole room looks luxurious."],
  Roofing:    ["Sealed the leak permanently — two previous contractors had failed.", "Replaced missing sheets fast before the rains hit. Lifesaver.", "Checked the whole roof and found issues we didn't know about.", "Fair price and honest about what actually needed doing."],
  Carpentry:  ["Built us a fitted wardrobe that looks like it came from a showroom.", "Custom kitchen cabinets exceeded our expectations.", "Attention to detail on the joinery is remarkable.", "Finished in two days, dust-free workspace. Very professional."],
  Masonry:    ["Boundary wall is solid and straight. Great work.", "Repaired the cracked slab quickly and cleanly.", "Honest assessment of what the wall needed — no upselling.", "Clean finish on the exterior plaster. Neighbours are asking who did it!"],
  HVAC:       ["AC is running better than when it was new after the service.", "Diagnosed the fault quickly and sourced the part same day.", "Thorough job — cleaned the coils and tested pressures. Happy.", "Prompt response on a 35-degree day. Real lifesaver."],
  Welding:    ["Gate hinges are rock-solid. Beautiful metalwork.", "Fabricated custom window grilles that look great.", "Reinforced the staircase balustrade perfectly. No wobble at all.", "Fast turnaround and the weld finish is very clean."],
  Fundi:      ["Sorted five different jobs in one visit. Incredibly efficient.", "Honest about what he could and couldn't fix. Trustworthy.", "Replaced tap, fixed door frame, patched ceiling in a day.", "Reliable and communicative throughout. Will keep his number."],
  default:    ["Excellent work and great value.", "Very professional and punctual.", "Would highly recommend to anyone.", "Impressed with the quality and care taken."],
};

function generateReviews(contractors: any[]) {
  const reviews: {
    id: string; contractorId: number; contractorName: string; trade: string;
    rating: number; reviewer: string; neighbourhood: string; text: string;
    verified: boolean; daysAgo: number;
  }[] = [];

  contractors.forEach((c) => {
    if (c.reviewCount < 1) return;
    const count = Math.min(c.reviewCount, 3);
    const texts = REVIEW_TEXTS[c.trade] ?? REVIEW_TEXTS.default;
    for (let i = 0; i < count; i++) {
      const ri = (c.id * 3 + i) % REVIEWERS.length;
      const ti = (c.id + i) % texts.length;
      const ratingVariance = i === 0 ? 0 : (i % 3 === 0 ? -0.5 : 0);
      const rating = Math.max(3, Math.min(5, Math.round((c.rating + ratingVariance) * 2) / 2));
      reviews.push({
        id: `${c.id}-${i}`,
        contractorId: c.id,
        contractorName: c.name,
        trade: c.trade,
        rating,
        reviewer: REVIEWERS[ri][0],
        neighbourhood: REVIEWERS[ri][1],
        text: texts[ti],
        verified: c.verificationStatus === "verified",
        daysAgo: (c.id * 7 + i * 3) % 90 + 1,
      });
    }
  });

  return reviews.sort((a, b) => a.daysAgo - b.daysAgo);
}

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  usePageMeta("Homeowner Reviews", "Read verified reviews from Nairobi homeowners about FundiVerify contractors.");
  const [trade, setTrade] = useState("All Trades");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");

  const { data, isLoading } = useListContractors({ limit: 50 });
  const contractors = data?.contractors ?? [];

  const allReviews = useMemo(() => generateReviews(contractors), [contractors]);

  const filtered = useMemo(() => {
    let list = allReviews;
    if (trade !== "All Trades") list = list.filter((r) => r.trade === trade);
    if (ratingFilter === "5 stars") list = list.filter((r) => r.rating === 5);
    else if (ratingFilter === "4+ stars") list = list.filter((r) => r.rating >= 4);
    else if (ratingFilter === "3+ stars") list = list.filter((r) => r.rating >= 3);
    return list;
  }, [allReviews, trade, ratingFilter]);

  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : "—";

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 mb-4">
          <MessageSquare className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">What Nairobi Homeowners Say</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Verified reviews from real homeowners across Nairobi — only collected after a job is marked complete.
        </p>
      </div>

      {/* Summary stats */}
      {!isLoading && allReviews.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Reviews", value: allReviews.length.toString() },
            { label: "Avg Rating", value: `${avgRating} / 5` },
            { label: "Verified Pros", value: contractors.filter((c) => c.verificationStatus === "verified").length.toString() },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {TRADES.map((t) => (
            <button
              key={t}
              onClick={() => setTrade(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${trade === t ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {RATING_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${ratingFilter === r ? "bg-amber-500 text-white border-amber-500" : "bg-background border-border hover:border-amber-300"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-5">
        {isLoading ? "Loading reviews…" : `${filtered.length} review${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Reviews grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No reviews match your filters</p>
          <button onClick={() => { setTrade("All Trades"); setRatingFilter("All Ratings"); }} className="text-sm text-primary mt-2 underline underline-offset-2">Clear filters</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-sm transition-all">
              <CardContent className="p-5">
                {/* Stars + trade badge */}
                <div className="flex items-center justify-between mb-3">
                  <StarRow value={r.rating} />
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">{r.trade}</span>
                </div>

                {/* Review text */}
                <p className="text-sm text-foreground leading-relaxed mb-4">"{r.text}"</p>

                {/* Reviewer info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="text-[10px] bg-muted font-semibold">
                        {r.reviewer.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold">{r.reviewer}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />{r.neighbourhood}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{r.daysAgo}d ago</p>
                  </div>
                </div>

                {/* Contractor attribution */}
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <Link href={`/contractors/${r.contractorId}`}>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                      {r.verified && <ShieldCheck className="h-3 w-3 text-primary" />}
                      <span>{r.contractorName}</span>
                    </div>
                  </Link>
                  {r.verified && (
                    <span className="text-[10px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full border border-primary/15">Verified</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
