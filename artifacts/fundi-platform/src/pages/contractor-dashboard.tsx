import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import { TrendingUp, Briefcase, Star, Eye, Clock, CheckCircle, ChevronRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetContractorDashboard,
  getGetContractorDashboardQueryKey,
} from "@workspace/api-client-react";

const CONTRACTOR_ID = 1;

export default function ContractorDashboard() {
  const { data, isLoading } = useGetContractorDashboard(CONTRACTOR_ID, {
    query: { queryKey: getGetContractorDashboardQueryKey(CONTRACTOR_ID) },
  });

  const statCards = [
    { label: "Total Earnings", value: data ? `KES ${data.totalEarnings.toLocaleString()}` : "—", icon: DollarSign, sub: `KES ${data?.thisMonthEarnings?.toLocaleString() ?? 0} this month` },
    { label: "Jobs Completed", value: data?.jobsCompleted ?? "—", icon: CheckCircle, sub: `${data?.activeJobs ?? 0} active` },
    { label: "Average Rating", value: data ? `${data.averageRating.toFixed(1)}/5.0` : "—", icon: Star, sub: "from verified reviews" },
    { label: "Profile Views", value: data?.profileViews ?? "—", icon: Eye, sub: `${data?.leadsReceived ?? 0} leads received` },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Pro Dashboard</h1>
          <p className="text-muted-foreground">Your earnings, performance, and job activity.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/jobs">Browse New Jobs</Link></Button>
          <Button asChild><Link href={`/contractors/${CONTRACTOR_ID}`}>View Profile</Link></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                {isLoading ? <Skeleton className="h-7 w-24 mb-1" /> : (
                  <p className="text-xl font-bold mb-1">{card.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Earnings Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Earnings — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.earningsByMonth ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Earnings"]}
                  contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Jobs & Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Jobs</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/jobs">Find More <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : data?.recentJobs && data.recentJobs.length > 0 ? data.recentJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer">
                  <div>
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.location} · {job.trade}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === "open" ? "default" : "secondary"} className="text-xs capitalize">
                      {job.status.replace("_", " ")}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No recent jobs</p>
                <Button asChild variant="outline" size="sm" className="mt-3"><Link href="/jobs">Browse open jobs</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Performance Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <Skeleton className="h-40 w-full" /> : (
              <>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Pending Quotes</span>
                  <span className="font-semibold">{data?.pendingQuotes ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Active Jobs</span>
                  <span className="font-semibold">{data?.activeJobs ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Leads Received</span>
                  <span className="font-semibold">{data?.leadsReceived ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">This Month Earnings</span>
                  <span className="font-semibold text-primary">KES {data?.thisMonthEarnings?.toLocaleString() ?? 0}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
