import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { ShieldCheck, Star, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useListContractors } from "@workspace/api-client-react";

const TRADES = ["All Trades", "Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];
const LOCATIONS = ["All Locations", "Westlands", "Kilimani", "Karen", "Kasarani", "Parklands", "Lavington", "Eastleigh", "South B", "Langata", "Ruaka"];

export default function ContractorsPage() {
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);

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

  const { data, isLoading } = useListContractors({
    search: search || undefined,
    trade: trade === "All Trades" ? undefined : trade,
    location: location === "All Locations" ? undefined : location,
    tier: (tier === "pro" || tier === "free") ? tier : undefined,
    verified: verified === "verified" ? true : undefined,
    limit: 24,
  });

  const activeFilters = [
    trade !== "All Trades" && trade,
    location !== "All Locations" && location,
    tier !== "all" && (tier === "pro" ? "Pro Members" : "Free Listing"),
    verified !== "all" && "Verified Only",
  ].filter(Boolean) as string[];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verified Contractors</h1>
        <p className="text-muted-foreground">Every pro listed here has been ID-verified, reference-checked, and portfolio-reviewed.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8 p-4 bg-card border rounded-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, trade, bio…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={trade} onValueChange={setTrade}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Trade" />
            </SelectTrigger>
            <SelectContent>
              {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-1">Tier:</span>
          {["all", "pro", "free"].map(t => (
            <Button key={t} variant={tier === t ? "default" : "outline"} size="sm" onClick={() => setTier(t)}>
              {t === "all" ? "All" : t === "pro" ? "Pro Members" : "Free Listing"}
            </Button>
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          <span className="text-sm text-muted-foreground mr-1">Status:</span>
          {["all", "verified"].map(v => (
            <Button key={v} variant={verified === v ? "default" : "outline"} size="sm" onClick={() => setVerified(v)}>
              {v === "all" ? "All" : "✓ Verified Only"}
            </Button>
          ))}
          {activeFilters.length > 0 && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => { setSearch(""); setTrade("All Trades"); setLocation("All Locations"); setTier("all"); setVerified("all"); }}
              >
                Clear all
              </Button>
            </>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {activeFilters.map((f) => (
              <Badge key={f} variant="secondary">{f}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{isLoading ? "Loading…" : `${data?.total ?? 0} contractors found`}</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-40 w-full rounded-lg" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.contractors.map((c) => (
            <Link key={c.id} href={`/contractors/${c.id}`}>
              <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-14 w-14 border-2 border-border flex-shrink-0">
                      <AvatarImage src={c.avatarUrl ?? ""} alt={c.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base truncate">{c.name}</h3>
                        {c.verificationStatus === "verified" && (
                          <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" title="Verified Pro" />
                        )}
                        {c.subscriptionTier === "pro" && (
                          <Badge className="text-xs py-0 px-1.5">Pro</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{c.trade}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />{c.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-foreground font-medium">{c.rating.toFixed(1)}</span>
                      <span>({c.reviewCount})</span>
                    </span>
                  </div>

                  {c.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{c.bio}</p>
                  )}

                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.jobsCompleted} jobs completed</span>
                    <span>{c.yearsExperience ?? 0} yrs experience</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {!isLoading && data?.contractors.length === 0 && (
            <div className="col-span-3 text-center py-20 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No contractors found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearch(""); setTrade("All Trades"); setLocation("All Locations"); setTier("all"); setVerified("all"); }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
