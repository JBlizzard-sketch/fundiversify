import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Trophy, Medal, Star, ShieldCheck, Briefcase, ChevronRight, Zap, Droplets, Paintbrush, Hammer, Layers, HardHat, Wind, Flame, Wrench, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useListContractors } from "@workspace/api-client-react";
import { usePageMeta } from "@/hooks/use-page-meta";

const TRADES = ["All Trades", "Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];

const TRADE_ICONS: Record<string, React.ElementType> = {
  Plumbing: Droplets, Electrical: Zap, Painting: Paintbrush,
  Carpentry: Hammer, Tiling: Layers, Roofing: HardHat,
  Masonry: HardHat, HVAC: Wind, Welding: Flame, Fundi: Wrench,
  default: Briefcase,
};

function fundiScore(c: { rating: number; jobsCompleted: number; verificationStatus: string; subscriptionTier: string }) {
  const ratingScore  = (c.rating / 5) * 40;
  const jobsScore    = Math.min(c.jobsCompleted / 50, 1) * 30;
  const verifyScore  = c.verificationStatus === "verified" ? 20 : 0;
  const tierScore    = c.subscriptionTier === "pro" ? 10 : 5;
  return Math.round(ratingScore + jobsScore + verifyScore + tierScore);
}

const MEDAL_COLORS = [
  "text-amber-500",   // 1st — gold
  "text-slate-400",   // 2nd — silver
  "text-orange-600",  // 3rd — bronze
];

const RANK_BADGE = [
  "bg-amber-50 border-amber-300 text-amber-700",
  "bg-slate-50 border-slate-300 text-slate-600",
  "bg-orange-50 border-orange-300 text-orange-700",
];

export default function LeaderboardPage() {
  usePageMeta("FundiScore™ Leaderboard", "Top verified contractors in Nairobi ranked by FundiScore™ — composite of rating, jobs, verification, and responsiveness.");
  const [tradeFilter, setTradeFilter] = useState("All Trades");

  const { data, isLoading } = useListContractors({ limit: 100 });
  const contractors = data?.contractors ?? [];

  const ranked = useMemo(() => {
    let list = [...contractors];
    if (tradeFilter !== "All Trades") list = list.filter((c) => c.trade === tradeFilter);
    return list
      .map((c) => ({ ...c, score: fundiScore(c) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [contractors, tradeFilter]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 mb-4">
          <Trophy className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">FundiScore™ Leaderboard</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Nairobi's top verified contractors, ranked by FundiScore™ — a composite of star rating, jobs completed, verification status, and Pro membership.
        </p>
      </div>

      {/* Score formula explainer */}
      <Card className="mb-8 bg-muted/30">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">How FundiScore™ is calculated</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Star Rating", weight: "40%", color: "text-amber-600 bg-amber-50 border-amber-200" },
              { label: "Jobs Completed", weight: "30%", color: "text-blue-600 bg-blue-50 border-blue-200" },
              { label: "Verified Badge", weight: "20%", color: "text-primary bg-primary/8 border-primary/20" },
              { label: "Pro Membership", weight: "10%", color: "text-violet-600 bg-violet-50 border-violet-200" },
            ].map(({ label, weight, color }) => (
              <div key={label} className={`rounded-lg border p-2.5 text-center ${color}`}>
                <p className="text-xl font-bold">{weight}</p>
                <p className="text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trade filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TRADES.map((t) => {
          const Icon = t === "All Trades" ? TrendingUp : (TRADE_ICONS[t] ?? TRADE_ICONS.default);
          return (
            <button
              key={t}
              onClick={() => setTradeFilter(t)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                tradeFilter === t ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t}
            </button>
          );
        })}
      </div>

      {/* Leaderboard list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : ranked.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No contractors found</p>
          <p className="text-sm mt-1">Try a different trade filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((c, i) => {
            const TradeIcon = TRADE_ICONS[c.trade] ?? TRADE_ICONS.default;
            const isTop3 = i < 3;
            const rankClass = isTop3 ? RANK_BADGE[i] : "bg-muted/40 border-border text-muted-foreground";
            const scoreColor = c.score >= 80 ? "text-green-600" : c.score >= 60 ? "text-amber-600" : "text-muted-foreground";
            const scoreBar = c.score >= 80 ? "bg-green-500" : c.score >= 60 ? "bg-amber-500" : "bg-muted-foreground/40";

            return (
              <Link key={c.id} href={`/contractors/${c.id}`}>
                <Card className={`cursor-pointer hover:shadow-md transition-all group ${isTop3 ? "hover:border-primary/40" : "hover:border-primary/30"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`flex-shrink-0 h-10 w-10 rounded-xl border-2 flex items-center justify-center font-bold text-sm ${rankClass}`}>
                        {i === 0 ? <Trophy className="h-5 w-5" /> : i === 1 ? <Medal className="h-5 w-5" /> : i === 2 ? <Medal className="h-5 w-5" /> : `#${i + 1}`}
                      </div>

                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarImage src={c.avatarUrl ?? ""} alt={c.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {c.verificationStatus === "verified" && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                            <ShieldCheck className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm">{c.name}</span>
                          {c.subscriptionTier === "pro" && <Badge className="text-[10px] py-0 px-1.5 h-4">Pro</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 text-primary font-medium"><TradeIcon className="h-3 w-3" />{c.trade}</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{c.rating.toFixed(1)}</span>
                          <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{c.jobsCompleted} jobs</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex-shrink-0 text-right min-w-[80px]">
                        <p className={`text-2xl font-bold leading-none mb-1 ${scoreColor}`}>{c.score}</p>
                        <p className="text-[10px] text-muted-foreground mb-1.5">FundiScore™</p>
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden ml-auto">
                          <div className={`h-full rounded-full ${scoreBar}`} style={{ width: `${c.score}%` }} />
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {!isLoading && ranked.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          FundiScore™ is updated daily. Only verified contractors appear in this ranking.
        </p>
      )}
    </div>
  );
}
