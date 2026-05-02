import { useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle, MapPin, Briefcase, Clock, FileText, DollarSign, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateJob, useGetJobEstimate, getGetJobEstimateQueryKey } from "@workspace/api-client-react";

const TRADES = ["Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];
const LOCATIONS = ["Westlands", "Kilimani", "Karen", "Kasarani", "Parklands", "Lavington", "Eastleigh", "South B", "Langata", "Ruaka", "Roysambu", "Thika Road"];

const TRADE_ICONS: Record<string, string> = {
  Plumbing: "🔧", Electrical: "⚡", Painting: "🖌️", Tiling: "🟦",
  Roofing: "🏠", Carpentry: "🪵", Masonry: "🧱", Fundi: "🔨", HVAC: "❄️", Welding: "🔥",
};

const STEPS = [
  { id: 1, label: "Trade & Location", icon: MapPin },
  { id: 2, label: "Job Details",      icon: FileText },
  { id: 3, label: "Budget & Timing",  icon: DollarSign },
  { id: 4, label: "Review & Post",    icon: CheckCircle },
];

export default function PostJobPage() {
  const [, navigate] = useLocation();
  const rawSearch = useSearch();
  const urlParams = new URLSearchParams(rawSearch);

  const [step, setStep] = useState(1);
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
    mutation: { onSuccess: (job) => navigate(`/jobs/${job.id}`) },
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const step1Valid = !!form.trade && !!form.location;
  const step2Valid = !!form.title && form.title.length >= 5 && !!form.description && form.description.length >= 20;
  const step3Valid = true; // budget & urgency are optional / always have defaults

  const canProceed = step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : false;

  const handleSubmit = () => {
    createJob.mutate({
      data: {
        homeownerId: 1,
        homeownerName: "Alice Wanjiku",
        title: form.title,
        trade: form.trade,
        location: form.location,
        description: form.description,
        estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : undefined,
        urgency: form.urgency as "flexible" | "within_week" | "asap",
      },
    });
  };

  const pct = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href="/jobs"><ArrowLeft className="h-4 w-4 mr-2" />Back to Jobs</Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Post a Job</h1>
        <p className="text-muted-foreground text-sm">Verified pros will quote within hours.</p>
      </div>

      {/* Step tracker */}
      <div className="mb-8">
        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex justify-between">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    done  ? "bg-primary border-primary text-primary-foreground" :
                    active? "border-primary text-primary bg-primary/10" :
                            "border-border text-muted-foreground/40 bg-muted"
                  }`}
                >
                  {done ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={`text-[10px] font-medium leading-tight text-center hidden sm:block ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step 1: Trade & Location ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">What trade do you need?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {TRADES.map((t) => (
                <button
                  key={t}
                  onClick={() => set("trade", t)}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    form.trade === t
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border bg-background hover:border-primary/40 hover:bg-primary/3"
                  }`}
                >
                  <span className="text-lg">{TRADE_ICONS[t]}</span>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Where in Nairobi?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LOCATIONS.map((l) => (
                <button
                  key={l}
                  onClick={() => set("location", l)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.location === l
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  {l}
                </button>
              ))}
            </div>
          </div>

          {form.trade && form.location && estimate && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3">
              <Calculator className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{form.trade} jobs in {form.location} typically cost</p>
                <p className="font-bold text-primary">KES {estimate.minKes.toLocaleString()} – {estimate.maxKes.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Job Details ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">What's the job title?</p>
            <Input
              className="h-12 text-base"
              placeholder={form.trade ? `e.g. Fix leaking ${form.trade.toLowerCase()} pipe in kitchen` : "e.g. Repaint 3-bedroom apartment"}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            {form.title.length > 0 && form.title.length < 5 && (
              <p className="text-xs text-red-500 mt-1">Title must be at least 5 characters</p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Describe the work in detail</p>
            <Textarea
              className="text-sm"
              rows={6}
              placeholder="Describe exactly what needs doing — size of the area, existing condition, specific materials or brands, access restrictions, any special requirements..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <div className="flex justify-between mt-1">
              {form.description.length > 0 && form.description.length < 20 && (
                <p className="text-xs text-red-500">Please give more detail (min 20 chars)</p>
              )}
              <span className={`text-xs ml-auto ${form.description.length >= 20 ? "text-green-600" : "text-muted-foreground"}`}>
                {form.description.length} / 500
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-muted/50 rounded-xl flex items-start gap-2.5 text-xs text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p>More detail = better quotes. Pros who can see the full scope will price more accurately and accept work with confidence.</p>
          </div>
        </div>
      )}

      {/* ── Step 3: Budget & Timing ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your budget (optional)</p>
            {estimate && (
              <div className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-center gap-2">
                <Calculator className="h-3.5 w-3.5 text-primary" />
                Typical range for {form.trade}: <strong className="text-foreground">KES {estimate.minKes.toLocaleString()} – {estimate.maxKes.toLocaleString()}</strong>
              </div>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">KES</span>
              <Input
                type="number"
                className="pl-14 h-12 text-base"
                placeholder="e.g. 15000"
                value={form.estimatedBudget}
                onChange={(e) => set("estimatedBudget", e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Sharing a budget helps filter serious pros. You can always negotiate.</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">How urgently do you need this?</p>
            <div className="space-y-2.5">
              {[
                { value: "asap",        label: "ASAP",       sublabel: "Within 24–48 hours",   color: "text-red-600 border-red-200 bg-red-50",     badge: "⚡" },
                { value: "within_week", label: "This Week",  sublabel: "Within the next 7 days", color: "text-amber-600 border-amber-200 bg-amber-50", badge: "📅" },
                { value: "flexible",    label: "Flexible",   sublabel: "No rush, best price",  color: "text-green-600 border-green-200 bg-green-50", badge: "🕐" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("urgency", opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                    form.urgency === opt.value
                      ? `border-current ${opt.color}`
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="text-xl">{opt.badge}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.sublabel}</p>
                  </div>
                  {form.urgency === opt.value && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Review & Post ── */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Review your job post</p>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{TRADE_ICONS[form.trade] ?? "🔧"}</span>
                <div>
                  <p className="font-bold text-base">{form.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{form.trade}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{form.location}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{form.description}</p>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Budget</p>
                  <p className="font-semibold text-sm">
                    {form.estimatedBudget ? `KES ${parseFloat(form.estimatedBudget).toLocaleString()}` : "Open to quotes"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Urgency</p>
                  <p className="font-semibold text-sm capitalize">
                    {form.urgency === "asap" ? "⚡ ASAP" : form.urgency === "within_week" ? "📅 This Week" : "🕐 Flexible"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {estimate && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Cost estimate for {form.trade} in {form.location}</span>
              </div>
              <p className="text-lg font-bold">KES {estimate.minKes.toLocaleString()} – {estimate.maxKes.toLocaleString()}</p>
              {estimate.note && <p className="text-xs text-muted-foreground mt-1">{estimate.note}</p>}
            </div>
          )}

          <div className="flex items-start gap-2.5 p-3.5 bg-muted/50 rounded-xl text-xs text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p>Your job will be visible to verified {form.trade} pros in {form.location}. You'll receive quotes within hours, typically.</p>
          </div>

          <div className="flex gap-2 items-center justify-between pt-1">
            <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
              Edit from start
            </button>
            <Button
              size="lg"
              className="flex-1 ml-4 h-12 text-base"
              onClick={handleSubmit}
              disabled={createJob.isPending}
            >
              {createJob.isPending ? "Posting…" : "Post Job — Get Free Quotes"}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation buttons (steps 1-3) */}
      {step < 4 && (
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          ) : (
            <div />
          )}
          <Button
            disabled={!canProceed}
            onClick={() => setStep(s => s + 1)}
            className="ml-auto"
          >
            {step === 3 ? "Review Job" : "Continue"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
