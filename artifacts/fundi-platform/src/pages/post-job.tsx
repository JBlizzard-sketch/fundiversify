import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Calculator, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateJob, useGetJobEstimate, getGetJobEstimateQueryKey } from "@workspace/api-client-react";

const TRADES = ["Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];
const LOCATIONS = ["Westlands", "Kilimani", "Karen", "Kasarani", "Parklands", "Lavington", "Eastleigh", "South B", "Langata", "Ruaka", "Roysambu", "Thika Road"];

export default function PostJobPage() {
  const [, navigate] = useLocation();
  const rawSearch = useSearch();
  const urlParams = new URLSearchParams(rawSearch);

  const [form, setForm] = useState({
    title: "",
    trade: urlParams.get("trade") ?? "",
    location: urlParams.get("location") ?? "",
    description: "",
    estimatedBudget: "",
    urgency: "flexible",
  });

  const { data: estimate } = useGetJobEstimate(
    { trade: form.trade, location: form.location },
    { query: { enabled: !!form.trade, queryKey: getGetJobEstimateQueryKey({ trade: form.trade }) } }
  );

  const createJob = useCreateJob({
    mutation: {
      onSuccess: (job) => navigate(`/jobs/${job.id}`),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.trade || !form.location || !form.description) return;
    createJob.mutate({
      data: {
        homeownerId: 1,
        homeownerName: "Homeowner",
        title: form.title,
        trade: form.trade,
        location: form.location,
        description: form.description,
        estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : undefined,
        urgency: form.urgency as "flexible" | "within_week" | "asap",
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href="/jobs"><ArrowLeft className="h-4 w-4 mr-2" />Back to Jobs</Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Post a Job</h1>
        <p className="text-muted-foreground">Describe your job and verified pros will quote competitively.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Job Title *</label>
              <Input
                placeholder="e.g. Fix leaking pipes in kitchen, Paint 3-bedroom apartment"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Trade Needed *</label>
                <Select value={form.trade} onValueChange={(v) => setForm(f => ({ ...f, trade: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trade" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Location *</label>
                <Select value={form.location} onValueChange={(v) => setForm(f => ({ ...f, location: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description *</label>
              <Textarea
                placeholder="Describe the work in detail — size, existing condition, any specific materials or brands you want, access restrictions..."
                rows={5}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Your Budget (KES, optional)</label>
                <Input
                  type="number"
                  placeholder="e.g. 15000"
                  value={form.estimatedBudget}
                  onChange={(e) => setForm(f => ({ ...f, estimatedBudget: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Urgency</label>
                <Select value={form.urgency} onValueChange={(v) => setForm(f => ({ ...f, urgency: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP (within 24-48 hrs)</SelectItem>
                    <SelectItem value="within_week">This week</SelectItem>
                    <SelectItem value="flexible">Flexible timeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Estimate Widget */}
        {form.trade && estimate && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-primary">Estimated Cost Range for {form.trade}</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold">KES {estimate.minKes.toLocaleString()}</span>
                <span className="text-muted-foreground">—</span>
                <span className="text-2xl font-bold">KES {estimate.maxKes.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{estimate.note}</p>
              <p className="text-xs text-muted-foreground">Typical duration: {estimate.typicalDays} day{estimate.typicalDays !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
          <p>Your job will be visible to verified pros matching your trade and location. You'll receive quotes within hours.</p>
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={createJob.isPending}>
          {createJob.isPending ? "Posting..." : "Post Job — Get Free Quotes"}
        </Button>
      </form>
    </div>
  );
}
