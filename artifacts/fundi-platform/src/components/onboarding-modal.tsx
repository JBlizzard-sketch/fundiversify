import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Search, Briefcase, ArrowRight, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "fv_onboarded_v1";

const TRADES = ["Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "HVAC"];
const TRADE_ICONS: Record<string, string> = {
  Plumbing: "🔧", Electrical: "⚡", Painting: "🖌️", Tiling: "🟦",
  Roofing: "🏠", Carpentry: "🪵", Masonry: "🧱", HVAC: "❄️",
};

const STEPS = [
  {
    icon: Shield,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Welcome to FundiVerify",
    subtitle: "Nairobi's only verified contractor marketplace",
    body: "Every pro on this platform has passed ID verification, reference checks, and portfolio review. No guesswork — just trusted fundis.",
    bullets: ["ID-verified contractors only", "Real reviews from completed jobs", "Dispute protection on every job"],
  },
  {
    icon: Search,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Find the right pro",
    subtitle: "Browse by trade, location, or rating",
    body: "Pick a trade to see verified pros near you:",
    bullets: [],
  },
  {
    icon: Briefcase,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    title: "Or post your job",
    subtitle: "Let pros come to you",
    body: "Describe what you need, set a budget, and get competing quotes from verified pros within hours. No chasing — it all comes to you.",
    bullets: ["Typically 3–5 quotes within 24 hours", "Compare quotes side by side", "Chat with pros before hiring"],
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedTrade, setSelectedTrade] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
      navigate("/jobs/new");
    }
  }

  function goFindPro() {
    dismiss();
    if (selectedTrade) {
      navigate(`/hire/${encodeURIComponent(selectedTrade)}/all`);
    } else {
      navigate("/contractors");
    }
  }

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isTradePicker = step === 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border overflow-hidden"
        style={{ animation: "onboard-in 0.3s ease" }}
      >
        {/* Progress dots */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-muted"}`}
            />
          ))}
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 pt-12">
          {/* Icon */}
          <div className={`h-16 w-16 rounded-2xl ${current.iconBg} flex items-center justify-center mb-6`}>
            <Icon className={`h-8 w-8 ${current.iconColor}`} />
          </div>

          <h2 className="text-2xl font-bold mb-1">{current.title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{current.subtitle}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{current.body}</p>

          {/* Bullets */}
          {current.bullets.length > 0 && (
            <ul className="space-y-2 mb-6">
              {current.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}

          {/* Trade picker (step 2) */}
          {isTradePicker && (
            <div className="grid grid-cols-4 gap-2 mb-6">
              {TRADES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTrade(t === selectedTrade ? "" : t)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${selectedTrade === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                >
                  <span className="text-xl">{TRADE_ICONS[t] ?? "🔧"}</span>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            {isTradePicker ? (
              <>
                <Button onClick={goFindPro} className="w-full gap-1.5">
                  {selectedTrade ? `Find ${selectedTrade} Pros` : "Browse All Pros"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={next}>
                  Post a job instead →
                </Button>
              </>
            ) : (
              <>
                <Button onClick={next} className="w-full gap-1.5">
                  {isLast ? "Post a Job Now" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {!isLast && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={dismiss}>
                    Skip — I'll explore on my own
                  </Button>
                )}
                {isLast && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { dismiss(); navigate("/contractors"); }}>
                    Browse pros instead
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes onboard-in {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
