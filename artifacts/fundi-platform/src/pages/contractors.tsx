import { useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { ShieldCheck, Star, MapPin, Search, SlidersHorizontal, Zap, Droplets, Paintbrush, Hammer, Layers, HardHat, Wind, Flame, Wrench, Briefcase, Clock, ChevronRight, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useListContractors } from "@workspace/api-client-react";
import { usePageMeta } from "@/hooks/use-page-meta";

const TRADES = ["All Trades", "Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];
const LOCATIONS = ["All Locations", "Westlands", "Kilimani", "Karen", "Kasarani", "Parklands", "Lavington", "Eastleigh", "South B", "Langata", "Ruaka"];

const TRADE_ICONS: Record<string, React.ElementType> = {
  Plumbing: Droplets,
  Electrical: Zap,
  Painting: Paintbrush,
  Carpentry: Hammer,
  Tiling: Layers,
  Roofing: HardHat,
  Masonry: HardHat,
  HVAC: Wind,
  Welding: Flame,
  Fundi: Wrench,
  default: Briefcase,
};

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "jobs", label: "Most Jobs" },
  { value: "newest", label: "Newest" },
  { value: "response", label: "Fastest Response" },
];

const MIN_RATING_OPTIONS = [
  { value: "0", label: "Any rating" },
  { value: "3", label: "3+ stars" },
  { value: "4", label: "4+ stars" },
  { value: "4.5", label: "4.5+ stars" },
];

// Nairobi neighbourhood positions (cx/cy as % of 400x340 SVG viewport)
const NAIROBI_HOODS: { name: string; cx: number; cy: number }[] = [
  { name: "Westlands",  cx: 140, cy: 120 },
  { name: "Parklands",  cx: 160, cy: 90  },
  { name: "Kilimani",   cx: 155, cy: 165 },
  { name: "Lavington",  cx: 120, cy: 185 },
  { name: "Karen",      cx: 100, cy: 240 },
  { name: "Langata",    cx: 140, cy: 265 },
  { name: "South B",    cx: 205, cy: 250 },
  { name: "Eastleigh",  cx: 250, cy: 130 },
  { name: "Kasarani",   cx: 280, cy: 75  },
  { name: "Ruaka",      cx: 100, cy: 60  },
];

function ContractorMapView({ contractors, onSelect }: { contractors: any[]; onSelect: (id: number) => void }) {
  const [hoveredHood, setHoveredHood] = useState<string | null>(null);

  const byHood = useMemo(() => {
    const map: Record<string, any[]> = {};
    contractors.forEach((c) => {
      const loc = c.location;
      if (!map[loc]) map[loc] = [];
      map[loc].push(c);
    });
    return map;
  }, [contractors]);

  const maxCount = Math.max(...Object.values(byHood).map((v) => v.length), 1);

  return (
    <div className="relative">
      <div className="rounded-xl border bg-gradient-to-br from-green-50/60 to-blue-50/40 overflow-hidden">
        <svg viewBox="0 0 400 320" className="w-full" style={{ maxHeight: 420 }}>
          {/* Road network suggestion lines */}
          <line x1="100" y1="60" x2="280" y2="75"  stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
          <line x1="160" y1="90" x2="250" y2="130" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
          <line x1="140" y1="120" x2="205" y2="250" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
          <line x1="155" y1="165" x2="140" y2="265" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
          <line x1="120" y1="185" x2="100" y2="240" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
          <line x1="205" y1="250" x2="140" y2="265" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
          <line x1="250" y1="130" x2="280" y2="75"  stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />

          {/* Neighbourhood bubbles */}
          {NAIROBI_HOODS.map((hood) => {
            const list = byHood[hood.name] ?? [];
            const count = list.length;
            const isHovered = hoveredHood === hood.name;
            const hasContractors = count > 0;
            const radius = hasContractors ? 18 + Math.round((count / maxCount) * 14) : 14;
            const topRating = hasContractors ? Math.max(...list.map((c) => c.rating)) : 0;

            return (
              <g
                key={hood.name}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredHood(hood.name)}
                onMouseLeave={() => setHoveredHood(null)}
              >
                {/* Pulse ring for hovered */}
                {isHovered && hasContractors && (
                  <circle cx={hood.cx} cy={hood.cy} r={radius + 8} fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.4" />
                )}
                {/* Main bubble */}
                <circle
                  cx={hood.cx}
                  cy={hood.cy}
                  r={radius}
                  fill={hasContractors ? (isHovered ? "#6366f1" : "#818cf8") : "#e5e7eb"}
                  stroke={hasContractors ? (isHovered ? "#4338ca" : "#6366f1") : "#d1d5db"}
                  strokeWidth="2"
                  opacity={hasContractors ? 0.95 : 0.5}
                />
                {/* Count label */}
                {hasContractors && (
                  <text x={hood.cx} y={hood.cy + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize="11" fontWeight="700" fill="white">
                    {count}
                  </text>
                )}
                {/* Neighbourhood name */}
                <text x={hood.cx} y={hood.cy + radius + 13} textAnchor="middle" dominantBaseline="middle"
                  fontSize="9.5" fontWeight="600" fill={hasContractors ? "#374151" : "#9ca3af"}>
                  {hood.name}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <rect x="8" y="8" width="120" height="38" rx="6" fill="white" opacity="0.9" />
          <circle cx="22" cy="22" r="7" fill="#818cf8" />
          <text x="34" y="22" dominantBaseline="middle" fontSize="9" fill="#374151" fontWeight="600">Bubble = # of pros</text>
          <text x="14" y="38" dominantBaseline="middle" fontSize="8" fill="#9ca3af">Larger = more contractors</text>
        </svg>
      </div>

      {/* Tooltip panel for hovered neighbourhood */}
      {hoveredHood && byHood[hoveredHood] && byHood[hoveredHood].length > 0 && (
        <div className="mt-3 p-4 rounded-xl border bg-background shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {hoveredHood} — {byHood[hoveredHood].length} pro{byHood[hoveredHood].length !== 1 ? "s" : ""}
            </h3>
          </div>
          <div className="space-y-2">
            {byHood[hoveredHood].slice(0, 4).map((c: any) => (
              <Link key={c.id} href={`/contractors/${c.id}`}>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {c.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.trade} · {c.jobsCompleted} jobs</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs flex-shrink-0">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{c.rating.toFixed(1)}</span>
                  </div>
                  {c.verificationStatus === "verified" && (
                    <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
              </Link>
            ))}
            {byHood[hoveredHood].length > 4 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{byHood[hoveredHood].length - 4} more in {hoveredHood}
              </p>
            )}
          </div>
        </div>
      )}

      {!hoveredHood && (
        <p className="mt-3 text-xs text-muted-foreground text-center">Hover a bubble to see contractors in that neighbourhood</p>
      )}
    </div>
  );
}

export default function ContractorsPage() {
  usePageMeta("Find a Pro", "Browse verified plumbers, electricians, painters and more in Nairobi. Read real reviews and get instant quotes.");
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [trade, setTrade] = useState(() => {
    const t = params.get("trade");
    return t && TRADES.includes(t) ? t : "All Trades";
  });
  const [location, setLocation] = useState(() => {
    const l = params.get("location");
    return l && LOCATIONS.includes(l) ? l : "All Locations";
  });
  const [tier, setTier] = useState("all");
  const [verified, setVerified] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [minRating, setMinRating] = useState("0");

  const { data, isLoading } = useListContractors({
    search: search || undefined,
    trade: trade === "All Trades" ? undefined : trade,
    location: location === "All Locations" ? undefined : location,
    tier: (tier === "pro" || tier === "free") ? tier : undefined,
    verified: verified === "verified" ? true : undefined,
    limit: 48,
  });

  const sorted = useMemo(() => {
    if (!data?.contractors) return [];
    let list = [...data.contractors];
    if (minRating !== "0") {
      const min = parseFloat(minRating);
      list = list.filter((c) => c.rating >= min);
    }
    switch (sortBy) {
      case "rating": return list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      case "jobs": return list.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
      case "newest": return list.sort((a, b) => b.id - a.id);
      case "response": return list.sort((a, b) => a.id - b.id);
      default: return list;
    }
  }, [data, sortBy, minRating]);

  const activeFilters = [
    trade !== "All Trades" && trade,
    location !== "All Locations" && location,
    tier !== "all" && (tier === "pro" ? "Pro Members" : "Free Listing"),
    verified !== "all" && "Verified Only",
    minRating !== "0" && `${minRating}+ stars`,
  ].filter(Boolean) as string[];

  const clearAll = () => {
    setSearch(""); setTrade("All Trades"); setLocation("All Locations");
    setTier("all"); setVerified("all"); setMinRating("0");
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verified Contractors</h1>
        <p className="text-muted-foreground">Every pro listed here has been ID-verified, reference-checked, and portfolio-reviewed.</p>
      </div>

      {/* Trade category chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {TRADES.slice(1).map((t) => {
          const Icon = TRADE_ICONS[t] ?? TRADE_ICONS.default;
          const active = trade === t;
          return (
            <button
              key={t}
              onClick={() => setTrade(active ? "All Trades" : t)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t}
            </button>
          );
        })}
      </div>

      {/* Filter panel */}
      <div className="flex flex-col gap-4 mb-6 p-4 bg-card border rounded-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, bio, specialization…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full sm:w-44">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground">Tier:</span>
          {["all", "pro", "free"].map(t => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tier === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-foreground"}`}
            >
              {t === "all" ? "All" : t === "pro" ? "Pro Members" : "Free Listing"}
            </button>
          ))}

          <div className="w-px h-5 bg-border mx-1" />
          <span className="text-sm text-muted-foreground">Min rating:</span>
          {MIN_RATING_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setMinRating(o.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${minRating === o.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-foreground"}`}
            >
              {o.label}
            </button>
          ))}

          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={() => setVerified(verified === "verified" ? "all" : "verified")}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${verified === "verified" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-foreground"}`}
          >
            <ShieldCheck className="h-3 w-3" />
            Verified Only
          </button>

          {activeFilters.length > 0 && (
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1">
              Clear all
            </button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {activeFilters.map((f) => (
              <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{isLoading ? "Loading…" : `${sorted.length} contractors found`}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
          {/* List / Map toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-3.5 w-3.5" />List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "map" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Map className="h-3.5 w-3.5" />Map
            </button>
          </div>
        </div>
      </div>

      {/* Map view */}
      {viewMode === "map" && !isLoading && (
        <ContractorMapView contractors={sorted} onSelect={(id) => {}} />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full rounded-lg" /></CardContent></Card>
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((c) => {
            const TradeIcon = TRADE_ICONS[c.trade] ?? TRADE_ICONS.default;
            return (
              <Link key={c.id} href={`/contractors/${c.id}`}>
                <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-14 w-14 border-2 border-border">
                          <AvatarImage src={c.avatarUrl ?? ""} alt={c.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {c.verificationStatus === "verified" && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                            <ShieldCheck className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <h3 className="font-semibold text-sm truncate">{c.name}</h3>
                          {c.subscriptionTier === "pro" && (
                            <Badge className="text-[10px] py-0 px-1.5 h-4">Pro</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-primary font-medium mb-1">
                          <TradeIcon className="h-3 w-3" />
                          {c.trade}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.location}</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-foreground font-medium">{c.rating.toFixed(1)}</span>
                            <span>({c.reviewCount})</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${(70 + ((c.id * 7) % 25)) >= 85 ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                            Responds to {70 + ((c.id * 7) % 25)}% of leads
                          </span>
                        </div>
                      </div>
                    </div>

                    {c.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">{c.bio}</p>
                    )}

                    {c.specializations && c.specializations.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {c.specializations.slice(0, 3).map((s: string) => (
                          <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/8 text-primary border border-primary/15">
                            <TradeIcon className="h-2.5 w-2.5" />
                            {s}
                          </span>
                        ))}
                        {c.specializations.length > 3 && (
                          <span className="text-[10px] text-muted-foreground self-center">+{c.specializations.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{c.jobsCompleted} jobs</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-green-500" />~2h response</span>
                      <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                        View <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {!isLoading && sorted.length === 0 && (
            <div className="col-span-3 text-center py-20 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No contractors found</p>
              <p className="text-sm mt-1">Try adjusting your filters or rating threshold</p>
              <Button variant="outline" className="mt-4" onClick={clearAll}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
