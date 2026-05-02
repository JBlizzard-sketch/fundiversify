import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import { Briefcase, Star, Eye, CheckCircle, ChevronRight, DollarSign, Upload, ImagePlus, X, Zap, ShieldCheck, TrendingUp, MapPin, Clock, Sparkles, AlertCircle } from "lucide-react";
import { ReferralCard } from "@/components/referral-card";
import { JobAlertWidget } from "@/components/job-alert-widget";
import { AvailabilityWidget } from "@/components/availability-widget";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetContractorDashboard,
  useGetContractor,
  useUpdateContractor,
  useGetJobMatches,
  getGetContractorDashboardQueryKey,
  getGetContractorQueryKey,
  getGetJobMatchesQueryKey,
} from "@workspace/api-client-react";
import { ObjectUploader } from "@workspace/object-storage-web";

const CONTRACTOR_ID = 1;

const PRO_BENEFITS = [
  { icon: TrendingUp, text: "Priority placement in search results" },
  { icon: ShieldCheck, text: "Verified Pro badge on your profile" },
  { icon: Star, text: "Unlimited quote submissions per month" },
  { icon: Zap, text: "Instant lead notifications via SMS" },
];

const URGENCY_COLOR: Record<string, string> = {
  asap: "text-red-600 bg-red-50 border-red-200",
  within_week: "text-amber-600 bg-amber-50 border-amber-200",
  flexible: "text-green-600 bg-green-50 border-green-200",
};

export default function ContractorDashboard() {
  const queryClient = useQueryClient();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [upgrading, setUpgrading] = useState(false);

  const { data, isLoading } = useGetContractorDashboard(CONTRACTOR_ID, {
    query: { queryKey: getGetContractorDashboardQueryKey(CONTRACTOR_ID) },
  });

  const { data: contractor } = useGetContractor(CONTRACTOR_ID, {
    query: { queryKey: getGetContractorQueryKey(CONTRACTOR_ID) },
  });

  const { data: matchedJobs = [] } = useGetJobMatches(
    { contractorId: CONTRACTOR_ID, limit: 8 },
    { query: { queryKey: getGetJobMatchesQueryKey({ contractorId: CONTRACTOR_ID, limit: 8 }), refetchInterval: 60000 } }
  );

  const updateContractor = useUpdateContractor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetContractorQueryKey(CONTRACTOR_ID) });
        setUpgrading(false);
      },
    },
  });

  const isPro = contractor?.subscriptionTier === "pro";

  const completenessItems = [
    { label: "Profile photo", done: !!contractor?.photoUrl },
    { label: "Bio written", done: !!(contractor?.bio && contractor.bio.length > 20) },
    { label: "Phone number", done: !!contractor?.phone },
    { label: "Specializations added", done: !!(contractor?.specializations && contractor.specializations.length > 0) },
    { label: "Years experience", done: !!(contractor?.yearsExperience && contractor.yearsExperience > 0) },
    { label: "ID document uploaded", done: !!contractor?.idDocUrl },
    { label: "Business permit uploaded", done: !!contractor?.businessPermitUrl },
  ];
  const completedCount = completenessItems.filter((i) => i.done).length;
  const completenessPercent = Math.round((completedCount / completenessItems.length) * 100);

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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">Pro Dashboard</h1>
            {isPro && <Badge className="text-xs">Pro Member</Badge>}
          </div>
          <p className="text-muted-foreground">Your earnings, performance, and job activity.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/jobs">Browse New Jobs</Link></Button>
          <Button asChild><Link href={`/contractors/${CONTRACTOR_ID}`}>View Profile</Link></Button>
        </div>
      </div>

      {/* Onboarding checklist — hidden when 100% complete */}
      <OnboardingChecklist
        items={[
          { label: "Profile photo", done: !!contractor?.photoUrl, hint: "A clear headshot builds trust", href: `/contractors/${CONTRACTOR_ID}` },
          { label: "Bio written", done: !!(contractor?.bio && contractor.bio.length > 20), hint: "Tell homeowners what you specialise in", href: `/contractors/${CONTRACTOR_ID}` },
          { label: "Phone number", done: !!contractor?.phone, hint: "So clients can reach you quickly" },
          { label: "Specialisations added", done: !!(contractor?.specializations && contractor.specializations.length > 0), hint: "e.g. Bathroom tiling, roof repairs" },
          { label: "Years of experience", done: !!(contractor?.yearsExperience && contractor.yearsExperience > 0), hint: "Homeowners prefer experienced pros" },
          { label: "ID document uploaded", done: !!contractor?.idDocUrl, hint: "Required for Verified badge" },
          { label: "Business permit uploaded", done: !!contractor?.businessPermitUrl, hint: "Required for Verified badge" },
        ]}
        completedCount={completedCount}
        percent={completenessPercent}
      />

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

      {/* Pro Upgrade CTA — only shown for free tier */}
      {!isPro && (
        <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Upgrade to Pro</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Get 3× more leads every month</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRO_BENEFITS.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-start md:items-center gap-3 flex-shrink-0">
                <div className="text-center">
                  <p className="text-3xl font-bold">KES 2,500</p>
                  <p className="text-sm text-muted-foreground">per month · M-Pesa</p>
                </div>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white w-full"
                  disabled={upgrading || updateContractor.isPending}
                  onClick={() => {
                    setUpgrading(true);
                    updateContractor.mutate({ id: CONTRACTOR_ID, data: { subscriptionTier: "pro" } });
                  }}
                >
                  {upgrading || updateContractor.isPending ? "Processing..." : "Upgrade Now"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Cancel anytime · No contract</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already Pro confirmation */}
      {isPro && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">You're a Pro Member</p>
              <p className="text-xs text-muted-foreground">Enjoying priority placement, verified badge, and unlimited leads.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Completeness Meter */}
      {contractor && completenessPercent < 100 && (
        <Card className="mb-6 border-blue-200 bg-blue-50/40">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="font-semibold text-sm text-blue-800">Complete your profile — {completenessPercent}% done</span>
                </div>
                <p className="text-xs text-blue-700/80 mb-3">
                  A complete profile gets up to 4× more views. {completenessItems.length - completedCount} item{completenessItems.length - completedCount !== 1 ? "s" : ""} left.
                </p>
                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${completenessPercent}%` }}
                  />
                </div>
                {/* Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {completenessItems.map(({ label, done }) => (
                    <div key={label} className={`flex items-center gap-2 text-xs ${done ? "text-green-700" : "text-blue-700"}`}>
                      {done
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        : <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 flex-shrink-0" />
                      }
                      <span className={done ? "line-through opacity-60" : ""}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 flex-shrink-0">
                <Link href={`/contractors/${CONTRACTOR_ID}`}>Edit Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {contractor && completenessPercent === 100 && (
        <Card className="mb-6 border-green-200 bg-green-50/40">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-green-800">Profile 100% complete!</p>
              <p className="text-xs text-green-700/80">Your profile is fully set up. Homeowners can find everything they need to hire you.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main tab area */}
      <Tabs defaultValue="matches" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="matches" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Matched Jobs
            {matchedJobs.length > 0 && (
              <Badge className="ml-1 text-xs py-0 px-1.5">{matchedJobs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">Recent Jobs</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Matched Jobs */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Jobs Matching Your Trade
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Open jobs in your area that match your skills — updated in real time.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {matchedJobs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No matching jobs at the moment</p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href="/jobs">Browse all open jobs</Link>
                  </Button>
                </div>
              ) : (
                matchedJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-start justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/20 transition-all cursor-pointer gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm">{job.title}</p>
                          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${URGENCY_COLOR[job.urgency] ?? "text-muted-foreground bg-muted"}`}>
                            {job.urgency === "asap" ? "Urgent" : job.urgency === "within_week" ? "This week" : "Flexible"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.trade}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(job.createdAt).toLocaleDateString("en-KE")}</span>
                        </div>
                        {job.estimatedBudget && (
                          <p className="text-xs text-primary font-medium mt-1">
                            Budget: KES {job.estimatedBudget.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">{job.quoteCount} quotes</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Job alert subscription */}
          <div className="mt-4">
            <JobAlertWidget
              defaultTrade={contractor?.trade}
              defaultLocation={contractor?.location}
            />
          </div>
        </TabsContent>

        {/* Recent Jobs */}
        <TabsContent value="recent">
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
                      <Badge variant={job.status === "open" ? "default" : "secondary"} className="text-xs capitalize">{job.status.replace("_", " ")}</Badge>
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
        </TabsContent>

        {/* Earnings */}
        <TabsContent value="earnings">
          <div className="space-y-6">
            {/* Summary KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Earned",       value: `KES ${(data?.totalEarnings ?? 0).toLocaleString()}`,          sub: "all time",                  color: "text-primary" },
                { label: "This Month",         value: `KES ${(data?.thisMonthEarnings ?? 0).toLocaleString()}`,      sub: "May 2026",                  color: "text-green-600" },
                { label: "Pending Payout",     value: `KES ${Math.round((data?.thisMonthEarnings ?? 0) * 0.6).toLocaleString()}`, sub: "Est. payout Jun 15", color: "text-amber-600" },
                { label: "Jobs Completed",     value: String(data?.jobsCompleted ?? 0),                              sub: "billable jobs",             color: "text-foreground" },
              ].map((kpi) => (
                <Card key={kpi.label}>
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                    {isLoading ? <Skeleton className="h-7 w-24 mb-1" /> : (
                      <p className={`text-xl font-bold mb-0.5 ${kpi.color}`}>{kpi.value}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Earnings chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Monthly Earnings — Last 6 Months
                </CardTitle>
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

            {/* Per-job payment history */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment History</CardTitle>
                <p className="text-xs text-muted-foreground">Each completed job and its estimated payment</p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                  </div>
                ) : data?.recentJobs && data.recentJobs.filter((j) => j.status === "completed" || j.status === "in_progress").length > 0 ? (
                  <div className="divide-y">
                    {data.recentJobs
                      .filter((j) => j.status === "completed" || j.status === "in_progress")
                      .map((job) => {
                        const amount = job.estimatedBudget ?? 0;
                        const isPaid = job.status === "completed";
                        return (
                          <div key={job.id} className="flex items-center justify-between py-3 gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{job.title}</p>
                              <p className="text-xs text-muted-foreground">{job.location} · {job.trade}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-semibold ${isPaid ? "text-green-700" : "text-amber-600"}`}>
                                {amount > 0 ? `KES ${amount.toLocaleString()}` : "TBD"}
                              </p>
                              <p className="text-xs text-muted-foreground">{isPaid ? "Paid" : "In progress"}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No completed jobs yet</p>
                    <p className="text-xs mt-1">Finish your first job to see payment history</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next payout + upgrade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-green-700" />
                    </div>
                    <p className="font-semibold text-sm text-green-800">Next Payout</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700 mb-1">
                    KES {Math.round((data?.thisMonthEarnings ?? 0) * 0.6).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-700/70">Estimated · June 15, 2026</p>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-green-800/70">M-Pesa disbursement · FundiVerify takes 10% platform fee.</p>
                  </div>
                </CardContent>
              </Card>

              {!isPro && (
                <Card className="border-amber-200 bg-amber-50/40">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-amber-700" />
                      </div>
                      <p className="font-semibold text-sm text-amber-800">Unlock Instant Payouts</p>
                    </div>
                    <p className="text-xs text-amber-700/80 mb-3">
                      Pro members get M-Pesa payouts within 24h of job completion — no more waiting until the 15th.
                    </p>
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white w-full"
                      onClick={() => updateContractor.mutate({ id: CONTRACTOR_ID, data: { subscriptionTier: "pro" } })}
                      disabled={updateContractor.isPending}
                    >
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Upgrade to Pro — KES 2,500/mo
                    </Button>
                  </CardContent>
                </Card>
              )}
              {isPro && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <p className="font-semibold text-sm">Pro Instant Payouts Active</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your earnings are disbursed via M-Pesa within 24h of each completed job. Reduced platform fee of 8%.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Portfolio */}
        <TabsContent value="portfolio">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Portfolio Photos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Add photos of your completed work to attract more clients</p>
              </div>
              <ObjectUploader
                maxNumberOfFiles={5}
                maxFileSize={10485760}
                onGetUploadParameters={async (file) => {
                  const res = await fetch("/api/storage/uploads/request-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                  });
                  const { uploadURL } = await res.json();
                  return { method: "PUT" as const, url: uploadURL, headers: { "Content-Type": file.type ?? "application/octet-stream" } };
                }}
                onComplete={(result) => {
                  const newPaths = result.successful
                    .map((f) => {
                      const url = f.uploadURL ?? f.response?.uploadURL;
                      if (!url) return null;
                      const match = url.match(/\/objects\/([^?]+)/);
                      if (match) return `/api/storage/objects/${match[1]}`;
                      return url.split("?")[0];
                    })
                    .filter(Boolean) as string[];
                  if (newPaths.length > 0) {
                    const updated = [...uploadedPhotos, ...newPaths];
                    setUploadedPhotos(updated);
                    updateContractor.mutate({ id: CONTRACTOR_ID, data: { portfolioPhotos: updated } });
                  }
                }}
                buttonClassName="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload Photos
              </ObjectUploader>
            </CardHeader>
            <CardContent>
              {uploadedPhotos.length === 0 ? (
                <div className="border-2 border-dashed border-muted rounded-xl p-10 text-center">
                  <ImagePlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No portfolio photos yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload photos of your best work to stand out from competitors</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {uploadedPhotos.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          const updated = uploadedPhotos.filter((_, j) => j !== i);
                          setUploadedPhotos(updated);
                          updateContractor.mutate({ id: CONTRACTOR_ID, data: { portfolioPhotos: updated } });
                        }}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Your Availability This Week</CardTitle></CardHeader>
              <CardContent>
                <AvailabilityWidget />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Earnings — Last 6 Months</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-48 w-full" /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data?.earningsByMonth ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Earnings"]} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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

          {/* Referral */}
          <ReferralCard contractorId={CONTRACTOR_ID} contractorName={contractor?.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
