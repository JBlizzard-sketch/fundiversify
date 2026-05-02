import { Link, useParams } from "wouter";
import { MapPin, Star, Briefcase, Clock, ArrowRight, ChevronRight, CheckCircle, DollarSign, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListContractors, useGetJobEstimate, useListJobs } from "@workspace/api-client-react";

const TRADE_ICONS: Record<string, string> = {
  Plumbing: "🔧", Electrical: "⚡", Painting: "🖌️", Tiling: "🟦",
  Roofing: "🏠", Carpentry: "🪵", Masonry: "🧱", Fundi: "🔨", HVAC: "❄️", Welding: "🔥",
};

const TRUST_POINTS = [
  "Every pro is ID-verified against the national registry",
  "Reference-checked from previous clients",
  "Dispute protection on every job",
];

export default function TradeLandingPage() {
  const params = useParams<{ trade: string; location?: string }>();
  const trade = decodeURIComponent(params.trade ?? "");
  const rawLoc = decodeURIComponent(params.location ?? "all");
  const location = rawLoc === "all" ? "" : rawLoc;

  const { data: contractorsData, isLoading: loadingContractors } = useListContractors({
    trade,
    location: location || undefined,
    sort: "rating",
    limit: 6,
  });

  const { data: estimate } = useGetJobEstimate({ trade, location: location || undefined });

  const { data: jobsData, isLoading: loadingJobs } = useListJobs({
    trade,
    location: location || undefined,
    status: "open",
    limit: 4,
  });

  const contractors = contractorsData?.contractors ?? [];
  const jobs = jobsData?.jobs ?? [];
  const displayLocation = location || "Nairobi";
  const tradeIcon = TRADE_ICONS[trade] ?? "🔧";

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background border-b py-14">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/contractors" className="hover:text-primary">Contractors</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{trade} in {displayLocation}</span>
          </nav>

          <div className="flex items-start gap-5 mb-6">
            <div className="text-5xl flex-shrink-0">{tradeIcon}</div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Verified {trade} Pros in {displayLocation}
              </h1>
              <p className="text-muted-foreground text-lg">
                {loadingContractors ? "..." : `${contractorsData?.total ?? 0} verified ${trade.toLowerCase()} contractors available`}
                {location ? ` in ${location}` : " across Nairobi"}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/jobs/new?trade=${encodeURIComponent(trade)}${location ? `&location=${encodeURIComponent(location)}` : ""}`}>
                Post a {trade} Job <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/contractors?trade=${encodeURIComponent(trade)}${location ? `&location=${encodeURIComponent(location)}` : ""}`}>
                Browse All {trade} Pros
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-4xl py-12 space-y-14">

        {/* Cost estimate card */}
        {estimate && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">{trade} Cost Guide — {displayLocation}</h2>
            </div>
            <Card className="border-primary/20 bg-primary/3">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Typical range</p>
                    <p className="text-2xl font-bold text-primary">KES {estimate.minKes.toLocaleString()} – {estimate.maxKes.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Typical duration</p>
                    <p className="text-2xl font-bold">{estimate.typicalDays} day{estimate.typicalDays !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Next step</p>
                    <Button asChild size="sm">
                      <Link href={`/jobs/new?trade=${encodeURIComponent(trade)}`}>Get Free Quotes</Link>
                    </Button>
                  </div>
                </div>
                {estimate.note && (
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t leading-relaxed">{estimate.note}</p>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Top pros */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">Top {trade} Pros in {displayLocation}</h2>
            <Link
              href={`/contractors?trade=${encodeURIComponent(trade)}${location ? `&location=${encodeURIComponent(location)}` : ""}`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingContractors ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          ) : contractors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="mb-4">No {trade} pros listed in {displayLocation} yet.</p>
                <Button asChild variant="outline">
                  <Link href={`/contractors?trade=${encodeURIComponent(trade)}`}>Search all of Nairobi</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {contractors.map((c, i) => (
                <Link key={c.id} href={`/contractors/${c.id}`}>
                  <Card className="group cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <span className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-700"}`}>
                          #{i + 1}
                        </span>

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
                            {c.photoUrl
                              ? <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">{c.name[0]}</div>
                            }
                          </div>
                          {c.isVerified && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                              <CheckCircle className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold group-hover:text-primary transition-colors">{c.name}</p>
                            {c.subscriptionTier === "pro" && (
                              <Badge className="text-xs py-0 px-1.5">Pro</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                            {c.averageRating > 0 && (
                              <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {c.averageRating.toFixed(1)} ({c.reviewCount})
                              </span>
                            )}
                            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{c.jobsCompleted} jobs</span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />~2h response
                          </div>
                          <Button size="sm" variant="outline" className="group-hover:border-primary group-hover:text-primary transition-colors">
                            View Profile
                          </Button>
                        </div>
                      </div>

                      {c.bio && (
                        <p className="text-xs text-muted-foreground mt-3 line-clamp-1 ml-20">{c.bio}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Open jobs in this trade */}
        {(jobs.length > 0 || loadingJobs) && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Open {trade} Jobs {location ? `in ${location}` : "in Nairobi"}</h2>
              <Link href={`/jobs?trade=${encodeURIComponent(trade)}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                All jobs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loadingJobs ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="group cursor-pointer hover:border-primary/40 transition-all">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{job.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(job.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {job.estimatedBudget && (
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground">Budget</p>
                              <p className="font-semibold text-sm">KES {job.estimatedBudget.toLocaleString()}</p>
                            </div>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${job.quoteCount === 0 ? "text-green-700 bg-green-50 border-green-200" : "text-muted-foreground bg-muted border-border"}`}>
                            {job.quoteCount === 0 ? "No quotes yet" : `${job.quoteCount} quotes`}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Why trust section */}
        <section className="rounded-2xl bg-muted/40 border p-8">
          <h2 className="text-xl font-bold mb-5">Why hire through FundiVerify?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TRUST_POINTS.map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href={`/jobs/new?trade=${encodeURIComponent(trade)}${location ? `&location=${encodeURIComponent(location)}` : ""}`}>
                <DollarSign className="h-4 w-4 mr-1.5" />Post a {trade} Job — Get Free Quotes
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/contractors?trade=${encodeURIComponent(trade)}`}>
                Browse {trade} Pros
              </Link>
            </Button>
          </div>
        </section>

        {/* Related trades */}
        <section>
          <h2 className="text-xl font-bold mb-4">Related Trades</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(TRADE_ICONS)
              .filter(([t]) => t !== trade)
              .slice(0, 6)
              .map(([t, icon]) => (
                <Link key={t} href={`/hire/${encodeURIComponent(t)}/all`}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card hover:border-primary/50 hover:bg-primary/3 transition-all text-sm font-medium">
                    <span>{icon}</span>{t}
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
