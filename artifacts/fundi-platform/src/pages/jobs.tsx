import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Clock, Briefcase, ChevronRight, Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useListJobs } from "@workspace/api-client-react";

const TRADES = ["All Trades", "Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];
const LOCATIONS = ["All Locations", "Westlands", "Kilimani", "Karen", "Kasarani", "Parklands", "Lavington", "Eastleigh", "South B", "Langata"];
const URGENCY_MAP: Record<string, { label: string; color: string }> = {
  asap: { label: "ASAP", color: "text-red-500 bg-red-50 border-red-100" },
  within_week: { label: "This Week", color: "text-amber-600 bg-amber-50 border-amber-100" },
  flexible: { label: "Flexible", color: "text-green-600 bg-green-50 border-green-100" },
};

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  open: { label: "Open", variant: "default" },
  quoted: { label: "Quoted", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "outline" },
  completed: { label: "Completed", variant: "outline" },
  disputed: { label: "Disputed", variant: "destructive" },
};

export default function JobsPage() {
  const [trade, setTrade] = useState("All Trades");
  const [location, setLocation] = useState("All Locations");
  const [status, setStatus] = useState("open");

  const { data, isLoading } = useListJobs({
    trade: trade === "All Trades" ? undefined : trade,
    location: location === "All Locations" ? undefined : location,
    status: status === "all" ? undefined : status as "open",
    limit: 24,
  });

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-card border rounded-xl">
        <Select value={trade} onValueChange={setTrade}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Trade" />
          </SelectTrigger>
          <SelectContent>
            {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2 flex-wrap">
          {["all", "open", "quoted"].map(s => (
            <Button key={s} variant={status === s ? "default" : "outline"} size="sm" onClick={() => setStatus(s)}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">{data ? `${data.total} jobs found` : "Loading..."}</div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.jobs.map((job) => {
            const urgency = URGENCY_MAP[job.urgency] ?? URGENCY_MAP.flexible;
            const statusInfo = STATUS_MAP[job.status] ?? STATUS_MAP.open;
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{job.title}</h3>
                          <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${urgency.color}`}>{urgency.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 text-primary font-medium"><Briefcase className="h-3.5 w-3.5" />{job.trade}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(job.createdAt).toLocaleDateString("en-KE")}</span>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-2">
                        {job.estimatedBudget && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Budget</p>
                            <p className="font-semibold">KES {job.estimatedBudget.toLocaleString()}</p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Quotes</p>
                          <p className="font-semibold">{job.quoteCount}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {data?.jobs.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No jobs found</p>
              <p className="text-sm mt-1 mb-6">Try different filters or post a new job</p>
              <Button asChild><Link href="/jobs/new">Post a Job</Link></Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
