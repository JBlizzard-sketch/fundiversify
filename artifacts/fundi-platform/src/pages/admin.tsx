import { useState } from "react";
import { Link } from "wouter";
import { ShieldCheck, AlertTriangle, Users, Briefcase, Star, CheckCircle, XCircle, FileText, ExternalLink, ChevronRight, MessageSquare, Clock, Eye } from "lucide-react";
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

const DISPUTE_STATUS_TABS = [
  { value: "open",         label: "Open",        color: "text-red-600 bg-red-50 border-red-200" },
  { value: "under_review", label: "Under Review", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "resolved",     label: "Resolved",     color: "text-green-600 bg-green-50 border-green-200" },
] as const;

type DisputeStatusTab = (typeof DISPUTE_STATUS_TABS)[number]["value"];

function DisputeCard({
  d,
  onUpdateStatus,
  onResolve,
  isPending,
}: {
  d: {
    id: number;
    jobId: number;
    jobTitle?: string | null;
    raisedByName: string;
    reason: string;
    description?: string | null;
    status: string;
    resolution?: string | null;
    createdAt: string;
  };
  onUpdateStatus: (id: number, status: string, resolution?: string) => void;
  onResolve: (id: number) => void;
  isPending: boolean;
}) {
  const [resolutionText, setResolutionText] = useState(d.resolution ?? "");
  const [showResolveForm, setShowResolveForm] = useState(false);

  const reasonLabel = d.reason.replace(/_/g, " ");

  const statusInfo =
    d.status === "open"         ? { label: "Open",         cls: "text-red-700 bg-red-50 border-red-200" }
    : d.status === "under_review" ? { label: "Under Review", cls: "text-amber-700 bg-amber-50 border-amber-200" }
    : d.status === "resolved"     ? { label: "Resolved",     cls: "text-green-700 bg-green-50 border-green-200" }
    :                               { label: d.status,        cls: "text-muted-foreground bg-muted border-border" };

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${d.status === "open" ? "border-red-200 bg-red-50/30" : d.status === "under_review" ? "border-amber-200 bg-amber-50/20" : "bg-muted/20"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${d.status === "open" ? "bg-red-100" : d.status === "under_review" ? "bg-amber-100" : "bg-green-100"}`}>
            <AlertTriangle className={`h-4 w-4 ${d.status === "open" ? "text-red-500" : d.status === "under_review" ? "text-amber-500" : "text-green-500"}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-semibold text-sm">{d.jobTitle ?? `Job #${d.jobId}`}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusInfo.cls}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              Reason: <span className="font-medium text-foreground">{reasonLabel}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Raised by: <span className="font-medium">{d.raisedByName}</span> · {new Date(d.createdAt).toLocaleDateString("en-KE")}
            </p>
          </div>
        </div>
        <Link href={`/jobs/${d.jobId}`} className="flex-shrink-0">
          <Button size="sm" variant="ghost" className="text-xs gap-1 h-7 px-2">
            <Eye className="h-3 w-3" />Job
            <ExternalLink className="h-2.5 w-2.5" />
          </Button>
        </Link>
      </div>

      {/* Description */}
      {d.description && (
        <div className="p-3 rounded-lg bg-background/60 border text-sm text-muted-foreground leading-relaxed">
          {d.description}
        </div>
      )}

      {/* Existing resolution */}
      {d.resolution && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
          <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />Admin Resolution
          </p>
          <p className="text-green-700">{d.resolution}</p>
        </div>
      )}

      {/* Actions */}
      {d.status !== "resolved" && (
        <div className="pt-1 space-y-2">
          {showResolveForm ? (
            <div className="space-y-2">
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                rows={3}
                placeholder="Describe the resolution — what was decided, any compensation or action taken..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowResolveForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!resolutionText.trim() || isPending}
                  onClick={() => {
                    onUpdateStatus(d.id, "resolved", resolutionText.trim());
                    setShowResolveForm(false);
                  }}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Confirm Resolution
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {d.status === "open" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  disabled={isPending}
                  onClick={() => onUpdateStatus(d.id, "under_review")}
                >
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Start Review
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-primary border-primary/30 hover:bg-primary/5"
                disabled={isPending}
                onClick={() => setShowResolveForm(true)}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Write Resolution
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => onUpdateStatus(d.id, "resolved", "Resolved by admin after review.")}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Quick Resolve
              </Button>
            </div>
          )}
        </div>
      )}

      {d.status === "resolved" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-muted-foreground"
            onClick={() => onUpdateStatus(d.id, "open")}
          >
            Reopen
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [disputeTab, setDisputeTab] = useState<DisputeStatusTab>("open");

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: pendingContractors } = useListContractors({ verified: false, limit: 20 });
  const { data: openDisputes }        = useListDisputes({ status: "open" });
  const { data: reviewDisputes }      = useListDisputes({ status: "under_review" });
  const { data: resolvedDisputes }    = useListDisputes({ status: "resolved" });

  const updateContractor = useUpdateContractor({
    mutation: { onSuccess: () => queryClient.invalidateQueries() },
  });

  const updateDispute = useUpdateDispute({
    mutation: { onSuccess: () => queryClient.invalidateQueries() },
  });

  const allDisputeCounts = {
    open:         openDisputes?.length ?? 0,
    under_review: reviewDisputes?.length ?? 0,
    resolved:     resolvedDisputes?.length ?? 0,
  };

  const currentDisputes =
    disputeTab === "open"         ? openDisputes
    : disputeTab === "under_review" ? reviewDisputes
    :                                 resolvedDisputes;

  const statCards = [
    { label: "Total Contractors", value: stats?.totalContractors,  icon: Users,          color: "text-blue-600 bg-blue-50" },
    { label: "Verified",          value: stats?.verifiedContractors, icon: ShieldCheck,  color: "text-green-600 bg-green-50" },
    { label: "Total Jobs",        value: stats?.totalJobs,          icon: Briefcase,      color: "text-violet-600 bg-violet-50" },
    { label: "Open Disputes",     value: stats?.openDisputes,       icon: AlertTriangle,  color: "text-red-600 bg-red-50" },
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
            Disputes
            {allDisputeCounts.open > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs py-0">{allDisputeCounts.open}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Verifications */}
        <TabsContent value="verifications">
          <Card>
            <CardHeader><CardTitle>Contractors Awaiting Verification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {pendingContractors?.contractors.length === 0 && (
                <div className="text-center py-12">
                  <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-50" />
                  <p className="text-muted-foreground text-sm">All caught up — no pending verifications</p>
                </div>
              )}
              {pendingContractors?.contractors.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border space-y-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={c.avatarUrl ?? ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{c.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold">{c.name}</p>
                        <Badge variant="outline" className="text-xs capitalize">{c.verificationStatus}</Badge>
                        {c.subscriptionTier === "pro" && <Badge className="text-xs">Pro</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{c.trade} · {c.location}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </div>
                    <Link href={`/contractors/${c.id}`}>
                      <Button size="sm" variant="ghost" className="gap-1 text-xs h-7">
                        Profile <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {c.idDocUrl ? (
                      <a href={c.idDocUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                        <FileText className="h-3.5 w-3.5" />National ID<ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-muted bg-muted/50 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />No ID uploaded
                      </span>
                    )}
                    {c.businessPermitUrl ? (
                      <a href={c.businessPermitUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                        <FileText className="h-3.5 w-3.5" />Business Permit<ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-muted bg-muted/50 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />No permit uploaded
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={updateContractor.isPending}
                      onClick={() => updateContractor.mutate({ id: c.id, data: { verificationStatus: "rejected" } })}
                    >
                      <XCircle className="h-4 w-4 mr-1" />Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={updateContractor.isPending}
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

        {/* Disputes */}
        <TabsContent value="disputes">
          {/* Status filter tabs */}
          <div className="flex gap-1 mb-4 bg-muted/40 p-1 rounded-xl w-fit">
            {DISPUTE_STATUS_TABS.map((tab) => {
              const count = allDisputeCounts[tab.value];
              return (
                <button
                  key={tab.value}
                  onClick={() => setDisputeTab(tab.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${disputeTab === tab.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${disputeTab === tab.value && tab.value === "open" ? "bg-red-500 text-white" : disputeTab === tab.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {currentDisputes?.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border rounded-xl">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No {disputeTab.replace("_", " ")} disputes</p>
              </div>
            ) : currentDisputes?.map((d) => (
              <DisputeCard
                key={d.id}
                d={d as any}
                isPending={updateDispute.isPending}
                onUpdateStatus={(id, status, resolution) =>
                  updateDispute.mutate({ id, data: { status: status as any, ...(resolution ? { resolution } : {}) } })
                }
                onResolve={(id) =>
                  updateDispute.mutate({ id, data: { status: "resolved", resolution: "Resolved by admin." } })
                }
              />
            ))}
          </div>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle>Recent Platform Activity</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {statsLoading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                : stats?.recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${item.type === "job_completed" ? "bg-green-500" : "bg-blue-500"}`} />
                    <p className="text-sm flex-1">{item.message}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(item.timestamp).toLocaleDateString("en-KE")}
                    </span>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
