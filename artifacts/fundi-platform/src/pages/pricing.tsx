import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle, X, Zap, ShieldCheck, Star, TrendingUp, MessageSquare, Award, ArrowRight, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const FREE_FEATURES = [
  { text: "Listed in contractor directory", included: true },
  { text: "Receive job match notifications", included: true },
  { text: "Submit up to 3 quotes/month", included: true },
  { text: "Basic profile page", included: true },
  { text: "Priority placement in search", included: false },
  { text: "Verified Pro badge", included: false },
  { text: "Unlimited quote submissions", included: false },
  { text: "Response rate badge", included: false },
  { text: "Featured in trade category", included: false },
  { text: "ID verification fast-track", included: false },
];

const PRO_FEATURES = [
  { text: "Listed in contractor directory", included: true },
  { text: "Receive job match notifications", included: true },
  { text: "Submit up to 3 quotes/month", included: true },
  { text: "Basic profile page", included: true },
  { text: "Priority placement in search", included: true },
  { text: "Verified Pro badge", included: true },
  { text: "Unlimited quote submissions", included: true },
  { text: "Response rate badge", included: true },
  { text: "Featured in trade category", included: true },
  { text: "ID verification fast-track", included: true },
];

const STATS = [
  { value: "3×", label: "More profile views for Pro members" },
  { value: "94%", label: "Of jobs are won by verified pros" },
  { value: "48h", label: "Average time to first paid job" },
  { value: "10K+", label: "Homeowners searching each month" },
];

const FAQS = [
  {
    q: "How does the M-Pesa payment work?",
    a: "Enter your Safaricom number and you'll receive an M-Pesa prompt on your phone. Confirm the KES 2,500 payment and your account upgrades instantly — no delays."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Your Pro membership runs monthly. Cancel before your next renewal date and you won't be charged again. You keep Pro access until the end of your paid period."
  },
  {
    q: "What is the 'Verified Pro' badge?",
    a: "It means FundiVerify has checked your National ID, confirmed your trade experience, and validated at least two references. Homeowners trust verified pros more — and our data shows it."
  },
  {
    q: "Do I have to be already verified to go Pro?",
    a: "No. You can upgrade to Pro at any time. Upgrading fast-tracks you in the verification queue — our team prioritises Pro applicants within 24 hours."
  },
];

type PayStep = "idle" | "entering" | "pending" | "success";

export default function PricingPage() {
  const [payStep, setPayStep] = useState<PayStep>("idle");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleUpgrade() {
    setPayStep("entering");
  }

  function handleSendPrompt() {
    if (!mpesaPhone.trim()) return;
    setPayStep("pending");
    setTimeout(() => setPayStep("success"), 3000);
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
          <Zap className="h-3 w-3" />Simple pricing · Cancel anytime
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Grow your business on FundiVerify</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Thousands of Nairobi homeowners post jobs every month. Pro members get first look, priority placement, and unlimited quotes.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {STATS.map(({ value, label }) => (
          <div key={value} className="text-center p-4 rounded-xl bg-muted/40">
            <p className="text-3xl font-bold text-primary">{value}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Free */}
        <Card className="border-2">
          <CardHeader className="pb-4 pt-6 px-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Free listing</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold">KES 0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">Get started — no credit card needed</p>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            {FREE_FEATURES.map(({ text, included }) => (
              <div key={text} className={`flex items-center gap-2.5 text-sm ${included ? "" : "opacity-40"}`}>
                {included
                  ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  : <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                }
                {text}
              </div>
            ))}
            <div className="pt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/apply">Apply as Free Pro</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-2 border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-bl-xl">
            MOST POPULAR
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-primary uppercase tracking-wider">Pro member</p>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold">KES 2,500</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">Paid via M-Pesa · Cancel anytime</p>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            {PRO_FEATURES.map(({ text, included }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                {text}
              </div>
            ))}

            <div className="pt-4">
              {payStep === "idle" && (
                <Button className="w-full h-11 text-base gap-2" onClick={handleUpgrade}>
                  <Zap className="h-4 w-4" />Upgrade to Pro via M-Pesa
                </Button>
              )}

              {payStep === "entering" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Enter your Safaricom number</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="07XX XXX XXX"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        maxLength={12}
                      />
                    </div>
                    <Button onClick={handleSendPrompt} disabled={!mpesaPhone.trim()}>
                      Send
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">You'll receive an M-Pesa push prompt to confirm KES 2,500.</p>
                  <button onClick={() => setPayStep("idle")} className="text-xs text-muted-foreground underline underline-offset-2">Cancel</button>
                </div>
              )}

              {payStep === "pending" && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                  <p className="text-sm font-medium">Waiting for M-Pesa confirmation...</p>
                  <p className="text-xs text-muted-foreground text-center">Check your phone for the STK push from M-Pesa and enter your PIN to confirm.</p>
                </div>
              )}

              {payStep === "success" && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-lg font-bold">You're now a Pro Member! 🎉</p>
                  <p className="text-sm text-muted-foreground">Your profile has been upgraded. Start submitting unlimited quotes and enjoy priority placement.</p>
                  <Button asChild className="mt-2 w-full">
                    <Link href="/dashboard/contractor">Go to Pro Dashboard <ArrowRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: TrendingUp, title: "Priority placement", desc: "Show up first when homeowners search your trade. More eyes on your profile = more leads.", color: "text-blue-600 bg-blue-50" },
          { icon: Star, title: "Unlimited quotes", desc: "Free members cap out at 3 quotes/month. Pro members submit unlimited — never miss an opportunity.", color: "text-amber-600 bg-amber-50" },
          { icon: MessageSquare, title: "Instant notifications", desc: "Get SMS alerts the moment a matching job is posted. Be first to quote and win more work.", color: "text-green-600 bg-green-50" },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="p-5 rounded-xl border bg-card">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Social proof */}
      <Card className="mb-12 bg-muted/30 border-0">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "James K.", trade: "Plumber · Westlands", quote: "Within my first week as Pro, I landed three jobs. The priority placement is real — homeowners see my profile first.", stars: 5 },
              { name: "Sarah M.", trade: "Painter · Kilimani", quote: "I was sceptical, but the verified badge made a huge difference. Clients trust me more and I close faster.", stars: 5 },
              { name: "Anthony N.", trade: "Roofer · Karen", quote: "The unlimited quotes feature alone paid for the subscription in my first job. Highly recommend for any serious fundi.", stars: 5 },
            ].map(({ name, trade, quote, stars }) => (
              <div key={name} className="space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"{quote}"</p>
                <div>
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{trade}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3 max-w-2xl mx-auto">
          {FAQS.map(({ q, a }, i) => (
            <div
              key={i}
              className="border rounded-xl overflow-hidden"
            >
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-sm">{q}</span>
                <span className={`text-lg text-muted-foreground transition-transform flex-shrink-0 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA bottom */}
      <div className="text-center py-10 rounded-2xl bg-gradient-to-b from-primary/5 to-primary/10 border border-primary/10">
        <Award className="h-10 w-10 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Ready to grow your business?</h2>
        <p className="text-muted-foreground mb-6">Join 500+ verified pros earning more every month with FundiVerify Pro.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild variant="outline">
            <Link href="/contractors">Browse Contractors</Link>
          </Button>
          <Button onClick={handleUpgrade} className="gap-2">
            <Zap className="h-4 w-4" />Upgrade to Pro — KES 2,500/mo
          </Button>
        </div>
      </div>
    </div>
  );
}
