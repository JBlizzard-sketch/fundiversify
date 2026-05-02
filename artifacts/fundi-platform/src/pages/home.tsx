import { useState } from "react";
import { useLocation } from "wouter";
import {
  Shield, Star, MapPin, Search, ArrowRight,
  CheckCircle2, Users, Briefcase, MessageSquare,
} from "lucide-react";
import { Link } from "wouter";
import { OnboardingModal } from "@/components/onboarding-modal";
import { StatsBanner } from "@/components/stats-bar";
import { ReviewMarquee } from "@/components/review-marquee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGetContractorStats, useListTrades } from "@workspace/api-client-react";

const TRADE_ICONS: Record<string, string> = {
  Plumbing: "🔧",
  Electrical: "⚡",
  Painting: "🖌️",
  Tiling: "🟦",
  Roofing: "🏠",
  Carpentry: "🪵",
  Masonry: "🧱",
  Fundi: "🔨",
  HVAC: "❄️",
  Welding: "🔥",
};

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Search & Compare",
    desc: "Browse verified contractors by trade and location. Read real reviews from completed jobs.",
  },
  {
    icon: MessageSquare,
    title: "Post Your Job",
    desc: "Describe what you need. Get competing quotes from up to 5 verified pros within 24 hours.",
  },
  {
    icon: CheckCircle2,
    title: "Hire with Confidence",
    desc: "Every Pro is ID-verified and accountable. Dispute protection on every job.",
  },
];

const LOCATIONS = [
  "Westlands", "Kilimani", "Karen", "Kasarani", "Parklands",
  "Lavington", "Eastleigh", "South B", "Langata", "Ruaka",
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [, navigate] = useLocation();

  const { data: stats } = useGetContractorStats();
  const { data: tradesData } = useListTrades();

  function handleSearch() {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/contractors?${params.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  const trades = tradesData?.trades?.slice(0, 10) ?? [];

  return (
    <div className="flex flex-col w-full">
      <OnboardingModal />
      {/* Hero */}
      <section className="relative w-full bg-gradient-to-b from-primary/5 to-background py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_50%)] -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
              <Shield className="h-3 w-3" />
              Nairobi's Only Verified Contractor Network
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Find Fundis You Can{" "}
              <span className="text-primary">Trust</span>.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              We separate the professionals from the chancers. Every Fundi Pro is vetted, reviewed, and accountable — from Kilimani to Kasarani.
            </p>

            {/* Search bar */}
            <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-3 p-3 bg-background rounded-2xl shadow-lg border">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Plumber, Electrician, Painter…"
                  className="pl-10 h-11 text-base border-0 focus-visible:ring-0 bg-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="hidden sm:block h-11 w-px bg-border self-center" />
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Westlands, Karen, Kasarani…"
                  className="pl-10 h-11 text-base border-0 focus-visible:ring-0 bg-transparent"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <Button size="lg" className="h-11 px-8" onClick={handleSearch}>
                Search
              </Button>
            </div>

            {/* Quick location chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {LOCATIONS.slice(0, 6).map((loc) => (
                <button
                  key={loc}
                  onClick={() => { setLocation(loc); }}
                  className="text-xs px-3 py-1 rounded-full border bg-background hover:border-primary/60 hover:text-primary transition-colors"
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-10 pt-4 text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold text-2xl text-foreground">
                  {stats?.totalVerified ?? 8}+
                </span>
                <span>Verified Pros</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold text-2xl text-foreground">10+</span>
                <span>Trades Covered</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-1 font-bold text-2xl text-foreground">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  {stats?.averageRating?.toFixed(1) ?? "4.7"}
                </span>
                <span>Avg Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated stats trust bar */}
      <StatsBanner totalVerified={stats?.totalVerified} averageRating={stats?.averageRating} />

      {/* Featured Trades */}
      <section className="py-20 container px-4 md:px-6">
        <div className="flex flex-col gap-3 text-center mb-12">
          <h2 className="text-3xl font-bold">Browse by Trade</h2>
          <p className="text-muted-foreground">
            {trades.length > 0
              ? `${trades.length} trades. All verified.`
              : "10 trades. All verified."}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {(trades.length > 0
            ? trades
            : Object.entries(TRADE_ICONS).map(([name]) => ({ name, contractorCount: 0 }))
          ).map((trade) => (
            <Link key={trade.name} href={`/hire/${encodeURIComponent(trade.name)}/all`}>
              <div className="group flex flex-col items-center gap-3 p-6 rounded-2xl border bg-card hover:border-primary/60 hover:shadow-md transition-all cursor-pointer">
                <span className="text-3xl">{TRADE_ICONS[trade.name] ?? "🔧"}</span>
                <div className="text-center">
                  <p className="font-semibold text-sm">{trade.name}</p>
                  {(trade as any).contractorCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(trade as any).contractorCount} pros
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-3 text-center mb-12">
            <h2 className="text-3xl font-bold">How FundiVerify Works</h2>
            <p className="text-muted-foreground">From search to job done — we keep you protected every step.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-20 container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-bold">Why Verified Matters</h2>
            <p className="text-muted-foreground">
              Nairobi's informal contractor market is ripe for opportunists. FundiVerify exists to change that — one verified badge at a time.
            </p>
            <ul className="flex flex-col gap-4">
              {[
                "ID verification against national registry",
                "Reference checks from 3 previous clients",
                "Portfolio review by our vetting team",
                "Ongoing accountability through job-linked reviews",
                "Dispute resolution with full audit trail",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/contractors">Browse Verified Pros</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/estimate">Get a Quote Estimate</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: "Verified Pros", value: `${stats?.totalVerified ?? 8}` },
              { icon: Star, label: "Average Rating", value: `${stats?.averageRating?.toFixed(1) ?? "4.7"}★` },
              { icon: Briefcase, label: "Active Jobs", value: "10+" },
              { icon: Users, label: "Happy Homeowners", value: "500+" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-6 rounded-2xl border bg-card flex flex-col gap-2">
                <Icon className="h-6 w-6 text-primary" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review marquee */}
      <ReviewMarquee />

      {/* CTA — Contractors */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold">Are You a Fundi?</h2>
          <p className="text-primary-foreground/80 max-w-xl">
            Join Nairobi's most trusted contractor network. Get your Verified Pro badge and start winning jobs from serious homeowners.
          </p>
          <div className="flex gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/apply">
                Apply to Join <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/jobs">Browse Open Jobs</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
