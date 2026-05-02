import { Calculator, TrendingDown, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetJobEstimate } from "@workspace/api-client-react";

interface EstimateWidgetProps {
  trade: string;
  location?: string;
  compact?: boolean;
}

export function EstimateWidget({ trade, location, compact = false }: EstimateWidgetProps) {
  const { data: estimate, isLoading } = useGetJobEstimate({
    trade,
    location: location || undefined,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse h-24 rounded-xl bg-muted" />
    );
  }

  if (!estimate) return null;

  const jobUrl = `/jobs/new?trade=${encodeURIComponent(trade)}${location ? `&location=${encodeURIComponent(location)}` : ""}`;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
        <Calculator className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Typical {trade} job cost in {location ?? "Nairobi"}</p>
          <p className="text-sm font-bold text-primary">
            KES {estimate.minKes.toLocaleString()} – {estimate.maxKes.toLocaleString()}
          </p>
        </div>
        <Button asChild size="sm" className="flex-shrink-0 h-8 text-xs">
          <Link href={jobUrl}>Get Quote</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <Calculator className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Cost Estimate — {trade} in {location ?? "Nairobi"}</h3>
      </div>

      <div className="px-5 pb-5 grid grid-cols-3 gap-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <TrendingDown className="h-3 w-3" /> Low
          </div>
          <p className="text-base font-bold">KES {estimate.minKes.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Typical</p>
          <p className="text-base font-bold text-primary">
            KES {Math.round((estimate.minKes + estimate.maxKes) / 2).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3 w-3" /> High
          </div>
          <p className="text-base font-bold">KES {estimate.maxKes.toLocaleString()}</p>
        </div>
      </div>

      {estimate.typicalDays && (
        <div className="flex items-center gap-2 px-5 pb-3 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Typical duration: {estimate.typicalDays} day{estimate.typicalDays !== 1 ? "s" : ""}
        </div>
      )}

      {estimate.note && (
        <p className="text-xs text-muted-foreground px-5 pb-3 leading-relaxed">{estimate.note}</p>
      )}

      <div className="px-5 pb-5">
        <Button asChild size="sm" className="w-full">
          <Link href={jobUrl}>
            Get Free Quotes from {trade} Pros <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
