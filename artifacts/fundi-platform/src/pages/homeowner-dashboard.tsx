import { Link } from "wouter";
import { Plus, Briefcase, Star, Bookmark, Clock, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetJobsSummary,
  useGetSavedContractors,
  getGetJobsSummaryQueryKey,
  getGetSavedContractorsQueryKey,
} from "@workspace/api-client-react";

const HOMEOWNER_ID = 1;

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  open: { label: "Open", icon: <Clock className="h-4 w-4" />, color: "text-blue-600 bg-blue-50" },
  quoted: { label: "Quoted", icon: <Briefcase className="h-4 w-4" />, color: "text-amber-600 bg-amber-50" },
  inProgress: { label: "In Progress", icon: <Briefcase className="h-4 w-4" />, color: "text-violet-600 bg-violet-50" },
  completed: { label: "Completed", icon: <CheckCircle className="h-4 w-4" />, color: "text-green-600 bg-green-50" },
  disputed: { label: "Disputed", icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600 bg-red-50" },
};

export default function HomeownerDashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetJobsSummary(
    { homeownerId: HOMEOWNER_ID },
    { query: { queryKey: getGetJobsSummaryQueryKey({ homeownerId: HOMEOWNER_ID }) } }
  );

  const { data: savedContractors, isLoading: savedLoading } = useGetSavedContractors(
    { homeownerId: HOMEOWNER_ID },
    { query: { queryKey: getGetSavedContractorsQueryKey({ homeownerId: HOMEOWNER_ID }) } }
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Dashboard</h1>
          <p className="text-muted-foreground">Track your jobs and saved contractors.</p>
        </div>
        <Button asChild>
          <Link href="/jobs/new"><Plus className="h-4 w-4 mr-2" />Post New Job</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = summary ? (summary as Record<string, number>)[key] ?? 0 : 0;
          return (
            <Card key={key} className={`${count > 0 ? "border-current/20" : ""}`}>
              <CardContent className="p-4">
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-1 mb-2 ${config.color}`}>
                  {config.icon}{config.label}
                </div>
                {summaryLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold">{count}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Jobs</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/jobs">View All <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaryLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : summary?.recentJobs && summary.recentJobs.length > 0 ? summary.recentJobs.map((job) => (
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
                <p className="text-sm">No jobs yet</p>
                <Button asChild variant="outline" size="sm" className="mt-3"><Link href="/jobs/new">Post your first job</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Contractors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saved Contractors</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/contractors">Find More <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : savedContractors && savedContractors.length > 0 ? savedContractors.map((c) => (
              <Link key={c.id} href={`/contractors/${c.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={c.avatarUrl ?? ""} />
                    <AvatarFallback>{c.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.trade} · {c.location}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {c.rating.toFixed(1)}
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No saved contractors</p>
                <Button asChild variant="outline" size="sm" className="mt-3"><Link href="/contractors">Browse directory</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
