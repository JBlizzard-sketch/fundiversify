import { ShieldCheck, AlertTriangle, Users, Briefcase, Star, TrendingUp, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboardStats,
  useListContractors,
  useListDisputes,
  useUpdateContractor,
  useUpdateDispute,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";

export default function AdminPage() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: pendingContractors } = useListContractors({ verified: false, limit: 20 });
  const { data: disputes } = useListDisputes({ status: "open" });

  const updateContractor = useUpdateContractor({
    mutation: { onSuccess: () => queryClient.invalidateQueries() },
  });

  const updateDispute = useUpdateDispute({
    mutation: { onSuccess: () => queryClient.invalidateQueries() },
  });

  const statCards = [
    { label: "Total Contractors", value: stats?.totalContractors, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Verified", value: stats?.verifiedContractors, icon: ShieldCheck, color: "text-green-600 bg-green-50" },
    { label: "Total Jobs", value: stats?.totalJobs, icon: Briefcase, color: "text-violet-600 bg-violet-50" },
    { label: "Open Disputes", value: stats?.openDisputes, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
        <p className="text-muted-foreground">Manage verifications, disputes, and platform health.</p>
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
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                {statsLoading ? <Skeleton className="h-7 w-16" /> : (
                  <p className="text-2xl font-bold">{card.value ?? 0}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="verifications">
        <TabsList className="mb-6">
          <TabsTrigger value="verifications">
            Pending Verifications
            {pendingContractors && pendingContractors.total > 0 && (
              <Badge className="ml-2 text-xs py-0">{pendingContractors.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="disputes">
            Open Disputes
            {disputes && disputes.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs py-0">{disputes.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="verifications">
          <Card>
            <CardHeader><CardTitle>Contractors Awaiting Verification</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pendingContractors?.contractors.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">No pending verifications</p>
              )}
              {pendingContractors?.contractors.map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-4 rounded-lg border">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={c.avatarUrl ?? ""} />
                    <AvatarFallback>{c.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{c.name}</p>
                      <Badge variant="outline" className="text-xs capitalize">{c.verificationStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.trade} · {c.location}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => updateContractor.mutate({ id: c.id, data: { verificationStatus: "rejected" } })}
                    >
                      <XCircle className="h-4 w-4 mr-1" />Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateContractor.mutate({ id: c.id, data: { verificationStatus: "verified" } })}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />Verify
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <Card>
            <CardHeader><CardTitle>Open Disputes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {disputes?.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">No open disputes</p>
              )}
              {disputes?.map((d) => (
                <div key={d.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p className="font-medium text-sm">{d.jobTitle ?? `Job #${d.jobId}`}</p>
                        <Badge variant="outline" className="text-xs capitalize">{d.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Raised by: {d.raisedByName}</p>
                      <p className="text-sm text-muted-foreground">Reason: {d.reason}</p>
                      {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateDispute.mutate({ id: d.id, data: { status: "under_review" } })}
                      >
                        Review
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateDispute.mutate({ id: d.id, data: { status: "resolved", resolution: "Resolved by admin after review" } })}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle>Recent Platform Activity</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {statsLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />) : (
                stats?.recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${item.type === "job_completed" ? "bg-green-500" : "bg-blue-500"}`} />
                    <p className="text-sm flex-1">{item.message}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(item.timestamp).toLocaleDateString("en-KE")}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
