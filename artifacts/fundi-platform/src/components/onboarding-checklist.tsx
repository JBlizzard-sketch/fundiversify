import { CheckCircle2, Circle, ChevronRight, Sparkles, Trophy, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ChecklistItem {
  label: string;
  done: boolean;
  hint?: string;
  href?: string;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  completedCount: number;
  percent: number;
}

const MILESTONE_MESSAGES: Record<number, { icon: React.ElementType; text: string; color: string }> = {
  0: { icon: Zap,      text: "Let's get you set up!",                 color: "text-amber-500" },
  1: { icon: Zap,      text: "Great start — keep going!",             color: "text-amber-500" },
  2: { icon: Zap,      text: "You're building trust. Nice.",          color: "text-amber-500" },
  3: { icon: Sparkles, text: "Halfway there — homeowners can see you!", color: "text-primary" },
  4: { icon: Sparkles, text: "Almost fully verified!",                color: "text-primary" },
  5: { icon: Sparkles, text: "One more step to top ranking!",         color: "text-primary" },
  6: { icon: Trophy,   text: "Nearly complete — you're elite!",       color: "text-primary" },
  7: { icon: Trophy,   text: "100% complete — you're a Verified Pro!", color: "text-green-600" },
};

export function OnboardingChecklist({ items, completedCount, percent }: OnboardingChecklistProps) {
  if (percent === 100) return null;

  const { icon: MilestoneIcon, text: milestoneText, color } = MILESTONE_MESSAGES[completedCount] ?? MILESTONE_MESSAGES[0];

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MilestoneIcon className={`h-5 w-5 ${color}`} />
            Complete Your Profile
          </CardTitle>
          <span className="text-sm font-semibold text-primary">{percent}%</span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className={`text-xs mt-1.5 font-medium ${color}`}>{milestoneText}</p>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              item.done ? "opacity-50" : "bg-background/60 border border-border/60"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.done ? "line-through text-muted-foreground" : ""}`}>
                {item.label}
              </p>
              {item.hint && !item.done && (
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              )}
            </div>
            {!item.done && item.href && (
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:text-primary flex-shrink-0">
                <Link href={item.href}>
                  Fix <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
