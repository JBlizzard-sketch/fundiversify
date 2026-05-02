import { useState, useMemo } from "react";
import { Link } from "wouter";
import { MapPin, Clock, Briefcase, ChevronRight, Plus, Zap, Droplets, Paintbrush, Hammer, Layers, HardHat, Wind, Flame, Wrench, ArrowUpDown, Users, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useListJobs } from "@workspace/api-client-react";
import { usePageMeta } from "@/hooks/use-page-meta";

const TRADES = ["All Trades", "Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];
const LOCATIONS = ["All Locations", "Westlands", "Kilimani", "Karen", "Kasarani", "Parklands", "Lavington", "Eastleigh", "South B", "Langata"];

const TRADE_ICONS: Record<string, React.ElementType> = {
  Plumbing: Droplets, Electrical: Zap, Painting: Paintbrush,
  Carpentry: Hammer, Tiling: Layers, Roofing: HardHat,
  Masonry: HardHat, HVAC: Wind, Welding: Flame, Fundi: Wrench,
  default: Briefcase,
};

const URGENCY_MAP: Record<string, { label: string; color: string; dot: string }> = {
  asap:        { label: "ASAP",      color: "text-red-600 bg-red-50 border-red-200",     dot: "bg-red-500" },
  within_week: { label: "This Week", color: "text-amber-600 bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  flexible:    { label: "Flexible",  color: "text-green-600 bg-green-50 border-green-200", dot: "bg-green-500" },
};

const STATUS_COLORS: Record<string, string> = {
  open:        "text-blue-700 bg-blue-50 border-blue-200",
  quoted:      "text-amber-700 bg-amber-50 border-amber-200",
  in_progress: "text-violet-700 bg-violet-50 border-violet-200",
  completed:   "text-green-700 bg-green-50 border-green-200",
  disputed:    "text-red-700 bg-red-50 border-red-200",
};

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first",     icon: Clock },
  { value: "budget_high",label: "Budget: High → Low", icon: TrendingDown },
  { value: "budget_low", label: "Budget: Low → High", icon: TrendingUp },
  { value: "most_quoted",label: "Most quoted",       icon: Users },
  { value: "fewest_quotes", label: "Least competition", icon: ArrowUpDown },
];

const URGENCY_FILTERS = [
  { value: "all",         label: "All urgencies" },
  { value: "asap",        label: "⚡ ASAP" },
  { value: "within_week", label: "📅 This Week" },
  { value: "flexible",    label: "🕐 Flexible" },
];

const BUDGET_PRESETS = [
  { label: "Any", min: 0, max: Infinity },
  { label: "< 5K", min: 0, max: 5000 },
  { label: "5–15K", min: 5000, max: 15000 },
  { label: "15–40K", min: 15000, max: 40000 },
  { label: "> 40K", min: 40000, max: Infinity },
];

export default function JobsPage() {
  usePageMeta("Browse Jobs", "Browse open home service jobs in Nairobi. Submit quotes and win work as a verified fundi.");
  const [trade, setTrade] = useState("All Trades");
  const [location, setLocation] = useState("All Locations");
  const [status, setStatus] = useState("open");
  const [urgency, setUrgency] = useState("all");
  const [budgetPreset, setBudgetPreset] = useState(0);
  const [sortBy, setSortBy] = useState("newest");

  const { data, isLoading } = useListJobs({
    trade: trade === "All Trades" ? undefined : trade,
    location: location === "All Locations" ? undefined : location,
    status: status === "all" ? undefined : status as "open",
    limit: 48,
  });

  const { min: budgetMin, max: budgetMax } = BUDGET_PRESETS[budgetPreset];

  const filtered = useMemo(() => {
    if (!data?.jobs) return [];
    let list = [...data.jobs];

    if (urgency !== "all") list = list.filter((j) => j.urgency === urgency);

    if (budgetPreset !== 0) {
      list = list.filter((j) => {
        const b = j.estimatedBudget ?? 0;
        return b >= budgetMin && b <= budgetMax;
      });
    }

    switch (sortBy) {
      case "newest":      list.sort((a, b) => b.id - a.id); break;
      case "budget_high": list.sort((a, b) => (b.estimatedBudget ?? 0) - (a.estimatedBudget ?? 0)); break;
      case "budget_low":  list.sort((a, b) => (a.estimatedBudget ?? 0) - (b.estimatedBudget ?? 0)); break;
      case "most_quoted": list.sort((a, b) => b.quoteCount - a.quoteCount); break;
      case "fewest_quotes": list.sort((a, b) => a.quoteCount - b.quoteCount); break;
    }

    return list;
  }, [data, urgency, budgetPreset, sortBy, budgetMin, budgetMax]);

  const activeFilters = [
    trade !== "All Trades" && trade,
    location !== "All Locations" && location,
    urgency !== "all" && URGENCY_FILTERS.find(u => u.value === urgency)?.label,
    budgetPreset !== 0 && BUDGET_PRESETS[budgetPreset].label,
  ].filter(Boolean) as string[];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Job Marketplace</h1>
          <p className="text-muted-foreground">Browse homeowner jobs and submit your competitive quote.</p>
        </div>
        <Button asChild>
          <Link href="/jobs/new"><Plus className="h-4 w-4 mr-2" />Post a Job</Link>
        </Button>
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"}`}
            >
              <Icon className="h-3.5 w-3.5" />{t}
            </button>
          );
        })}
      </div>

      {/* Filter panel */}
      <div className="flex flex-col gap-3 mb-6 p-4 bg-card border rounded-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="sm:w-48">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="sm:w-52">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          {[
            { v: "open",   l: "Open" },
            { v: "quoted", l: "Quoted" },
            { v: "all",    l: "All" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setStatus(v)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${status === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
            >
              {l}
            </button>
          ))}

          <div className="w-px h-4 bg-border mx-1" />
          <span className="text-xs text-muted-foreground font-medium">Urgency:</span>
          {URGENCY_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setUrgency(value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${urgency === value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Budget preset row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Budget:</span>
          {BUDGET_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => setBudgetPreset(i)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${budgetPreset === i ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
            >
              {preset.label}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={() => { setTrade("All Trades"); setLocation("All Locations"); setUrgency("all"); setBudgetPreset(0); setStatus("open"); }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear all
              </button>
            </>
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

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{isLoading ? "Loading…" : `${filtered.length} jobs found`}</span>
        <span className="text-xs">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No jobs match your filters</p>
          <p className="text-sm mt-1 mb-6">Try broadening your search or post a new job</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setTrade("All Trades"); setUrgency("all"); setBudgetPreset(0); }}>
              Clear filters
            </Button>
            <Button asChild><Link href="/jobs/new">Post a Job</Link></Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const urgencyInfo = URGENCY_MAP[job.urgency] ?? URGENCY_MAP.flexible;
            const TradeIcon = TRADE_ICONS[job.trade] ?? TRADE_ICONS.default;
            const isHot = job.urgency === "asap";
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className={`cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group ${isHot ? "border-red-200" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1 min-w-0">
                        {/* Trade icon bubble */}
                        <div className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ${isHot ? "bg-red-50" : "bg-primary/8"}`}>
                          <TradeIcon className={`h-5 w-5 ${isHot ? "text-red-500" : "text-primary"}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">{job.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${urgencyInfo.color}`}>
                              {urgencyInfo.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 capitalize ${STATUS_COLORS[job.status] ?? ""}`}>
                              {job.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2.5">{job.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <TradeIcon className="h-3 w-3 text-primary" />{job.trade}
                            </span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(job.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-3 flex-shrink-0 md:min-w-[100px]">
                        {job.estimatedBudget ? (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Budget</p>
                            <p className="font-bold text-base">KES {job.estimatedBudget.toLocaleString()}</p>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Budget</p>
                            <p className="text-sm text-muted-foreground">Not set</p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Quotes</p>
                          <p className={`font-semibold text-sm ${job.quoteCount === 0 ? "text-green-600" : ""}`}>
                            {job.quoteCount === 0 ? "Be first!" : job.quoteCount}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
