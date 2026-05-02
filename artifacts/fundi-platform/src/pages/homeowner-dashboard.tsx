import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Plus, Briefcase, Star, Bookmark, Clock, CheckCircle, AlertTriangle, ChevronRight, TrendingUp, RotateCcw, ShieldAlert, DollarSign, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewNudge } from "@/components/review-nudge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedJobs } from "@/hooks/use-saved-jobs";
import {
  useGetJobsSummary,
  useGetSavedContractors,
  useListJobs,
  getGetJobsSummaryQueryKey,
  getGetSavedContractorsQueryKey,
} from "@workspace/api-client-react";

const HOMEOWNER_ID = 1;

const STATUS_COLORS: Record<string, string> = {
  open:        "text-blue-700 bg-blue-50 border-blue-200",
  quoted:      "text-amber-700 bg-amber-50 border-amber-200",
  in_progress: "text-violet-700 bg-violet-50 border-violet-200",
  completed:   "text-green-700 bg-green-50 border-green-200",
  disputed:    "text-red-700 bg-red-50 border-red-200",
  cancelled:   "text-muted-foreground bg-muted border-border",
};

const STAT_CARDS = [
  { key: "open",        label: "Open",        icon: Clock,         color: "text-blue-600 bg-blue-50" },
  { key: "quoted",      label: "Quoted",      icon: Briefcase,     color: "text-amber-600 bg-amber-50" },
  { key: "inProgress",  label: "In Progress", icon: TrendingUp,    color: "text-violet-600 bg-violet-50" },
  { key: "completed",   label: "Completed",   icon: CheckCircle,   color: "text-green-600 bg-green-50" },
  { key: "disputed",    label: "Disputed",    icon: AlertTriangle, color: "text-red-600 bg-red-50" },
];

type Tab = "active" | "history" | "savedJobs" | "saved" | "spending";

export default function HomeownerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("active");

  const { data: summary, isLoading: summaryLoading } = useGetJobsSummary(
    { homeownerId: HOMEOWNER_ID },
    { query: { queryKey: getGetJobsSummaryQueryKey({ homeownerId: HOMEOWNER_ID }) } }
  );

  const { data: savedContractors, isLoading: savedLoading } = useGetSavedContractors(
    { homeownerId: HOMEOWNER_ID },
    { query: { queryKey: getGetSavedContractorsQueryKey({ homeownerId: HOMEOWNER_ID }) } }
  );

  const allJobs = summary?.recentJobs ?? [];
  const activeJobs = allJobs.filter((j) => ["open", "quoted", "in_progress"].includes(j.status));
  const historyJobs = allJobs.filter((j) => ["completed", "disputed", "cancelled"].includes(j.status));

  const totalSpent = historyJobs
    .filter((j) => j.status === "completed" && j.estimatedBudget)
    .reduce((sum, j) => sum + (j.estimatedBudget ?? 0), 0);

  const completedCount = historyJobs.filter((j) => j.status === "completed").length;

  const { savedIds } = useSavedJobs();
  const { data: allJobsData } = useListJobs({ limit: 100 });
  const savedJobsList = (allJobsData?.jobs ?? []).filter((j) => savedIds.has(j.id));

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "active",     label: "Active Jobs",   count: activeJobs.length },
    { key: "history",    label: "History",       count: historyJobs.length },
    { key: "savedJobs",  label: "Saved Jobs",    count: savedJobsList.length },
    { key: "saved",      label: "Saved Pros",    count: savedContractors?.length },
    { key: "spending",   label: "Spending" },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <ReviewNudge completedJobs={historyJobs.filter((j) => j.status === "completed").map((j) => ({ id: j.id, title: j.title, trade: j.trade }))} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Dashboard</h1>
          <p className="text-muted-foreground">Alice Wanjiku · Homeowner</p>
        </div>
        <Button asChild>
          <Link href="/jobs/new"><Plus className="h-4 w-4 mr-2" />Post New Job</Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => {
          const count = summary ? (summary as Record<string, number>)[key] ?? 0 : 0;
          return (
            <Card key={key} className={`cursor-pointer transition-all hover:shadow-sm ${count > 0 ? "" : "opacity-60"}`}
              onClick={() => {
                if (key === "open" || key === "quoted" || key === "inProgress") setActiveTab("active");
                else if (key === "completed" || key === "disputed") setActiveTab("history");
              }}
            >
              <CardContent className="p-4">
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-1 mb-2 ${color}`}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </div>
                {summaryLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold">{count}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Jobs */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {summaryLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : activeJobs.length > 0 ? activeJobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${job.status === "open" ? "bg-blue-500" : job.status === "quoted" ? "bg-amber-500 animate-pulse" : "bg-violet-500"}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.location} · {job.trade}</p>
                        {job.estimatedBudget && (
                          <p className="text-xs text-muted-foreground">Budget: KES {job.estimatedBudget.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[job.status] ?? ""}`}>
                        {job.status.replace("_", " ")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )) : (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No active jobs</p>
              <p className="text-sm mt-1">Post a job and get quotes from verified pros</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/jobs/new">Post a Job</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {summaryLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : historyJobs.length > 0 ? historyJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${job.status === "completed" ? "bg-green-50" : job.status === "disputed" ? "bg-red-50" : "bg-muted"}`}>
                      {job.status === "completed" ? <CheckCircle className="h-4 w-4 text-green-600" /> : job.status === "disputed" ? <ShieldAlert className="h-4 w-4 text-red-500" /> : <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.location} · {job.trade}</p>
                      {job.estimatedBudget && (
                        <p className="text-xs font-medium text-foreground">KES {job.estimatedBudget.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[job.status] ?? ""}`}>
                      {job.status}
                    </span>
                    <div className="flex gap-1.5">
                      {job.status === "completed" && (
                        <Link href={`/jobs/${job.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 gap-1">
                            <Star className="h-3 w-3" />Review
                          </Button>
                        </Link>
                      )}
                      <Link href={`/jobs/new?rebook=${job.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2.5 gap-1 text-muted-foreground">
                          <RotateCcw className="h-3 w-3" />Re-book
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No completed jobs yet</p>
              <p className="text-sm mt-1">Completed jobs will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Saved Jobs */}
      {activeTab === "savedJobs" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{savedJobsList.length} saved {savedJobsList.length === 1 ? "job" : "jobs"}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/jobs">Browse Jobs <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          {savedJobsList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-xl">
              <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No saved jobs yet</p>
              <p className="text-sm mt-1">Tap the bookmark icon on any job card to save it here</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/jobs">Browse Jobs</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedJobsList.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                            <span>· {job.trade}</span>
                          </p>
                          {job.estimatedBudget && (
                            <p className="text-xs font-medium text-foreground mt-1">Budget: KES {job.estimatedBudget.toLocaleString()}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[job.status] ?? ""}`}>
                            {job.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">{job.quoteCount} quote{job.quoteCount !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Contractors */}
      {activeTab === "saved" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{savedContractors?.length ?? 0} saved contractors</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/contractors">Find More <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : savedContractors && savedContractors.length > 0 ? savedContractors.map((c) => (
              <Link key={c.id} href={`/contractors/${c.id}`}>
                <Card className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={c.avatarUrl ?? ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{c.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.trade} · {c.location}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">{c.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({c.reviewCount} reviews)</span>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline" className="flex-shrink-0">
                        <Link href={`/jobs/new?contractorId=${c.id}`}>Book</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <div className="col-span-2 text-center py-16 text-muted-foreground">
                <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No saved contractors</p>
                <p className="text-sm mt-1">Save your favourite pros for quick re-booking</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/contractors">Browse Directory</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spending */}
      {activeTab === "spending" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <p className="text-3xl font-bold">KES {totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">across {completedCount} completed jobs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Jobs Posted</p>
                </div>
                <p className="text-3xl font-bold">{allJobs.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{activeJobs.length} active, {historyJobs.length} past</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Job Value</p>
                </div>
                <p className="text-3xl font-bold">
                  KES {completedCount > 0 ? Math.round(totalSpent / completedCount).toLocaleString() : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">per completed job</p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown by trade */}
          {historyJobs.filter((j) => j.status === "completed").length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Spend by Trade</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const byTrade: Record<string, { count: number; total: number }> = {};
                  historyJobs
                    .filter((j) => j.status === "completed")
                    .forEach((j) => {
                      if (!byTrade[j.trade]) byTrade[j.trade] = { count: 0, total: 0 };
                      byTrade[j.trade].count++;
                      byTrade[j.trade].total += j.estimatedBudget ?? 0;
                    });
                  const entries = Object.entries(byTrade).sort((a, b) => b[1].total - a[1].total);
                  const maxTotal = Math.max(...entries.map(([, v]) => v.total), 1);
                  return entries.map(([tradeName, { count, total }]) => (
                    <div key={tradeName} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{tradeName}</span>
                        <span className="text-muted-foreground">KES {total.toLocaleString()} · {count} job{count !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.round((total / maxTotal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>
          )}

          {/* Completed jobs list */}
          {historyJobs.filter((j) => j.status === "completed").length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Completed Jobs</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {historyJobs.filter((j) => j.status === "completed").map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.trade} · {job.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold">KES {(job.estimatedBudget ?? 0).toLocaleString()}</p>
                      <Link href={`/jobs/new?rebook=${job.id}`}>
                        <button className="text-xs text-primary flex items-center gap-1 ml-auto hover:underline">
                          <RotateCcw className="h-3 w-3" />Re-book
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {completedCount === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No spending data yet</p>
              <p className="text-sm mt-1">Complete a job to track your spending</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
