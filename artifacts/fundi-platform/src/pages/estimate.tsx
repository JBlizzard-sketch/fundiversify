import { useState } from "react";
import { Calculator, ArrowRight, Info, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useGetJobEstimate, getGetJobEstimateQueryKey } from "@workspace/api-client-react";

const TRADES = ["Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];
const LOCATIONS = ["Westlands", "Kilimani", "Karen", "Kasarani", "Parklands", "Lavington", "Eastleigh", "South B", "Langata"];

export default function EstimatePage() {
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");

  const { data: estimate, isLoading } = useGetJobEstimate(
    { trade, location: location || undefined, size: size || undefined },
    { query: { enabled: !!trade, queryKey: getGetJobEstimateQueryKey({ trade, location, size }) } }
  );

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
          <Calculator className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Job Cost Estimator</h1>
        <p className="text-muted-foreground text-lg">
          Get a realistic KES price range for your job before you even post. Based on current Nairobi contractor market rates.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">What type of work?</label>
            <Select value={trade} onValueChange={setTrade}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select a trade..." />
              </SelectTrigger>
              <SelectContent>
                {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Your location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Size (sqm, if applicable)</label>
              <Input
                type="number"
                placeholder="e.g. 30"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {trade && (
        <div className="space-y-6">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Calculating estimate...</CardContent></Card>
          ) : estimate ? (
            <>
              <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
                <CardContent className="p-8">
                  <p className="text-sm font-medium text-muted-foreground mb-2">{trade} — {location || "Nairobi"}</p>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold">KES {estimate.minKes.toLocaleString()}</span>
                    <span className="text-xl text-muted-foreground font-medium">—</span>
                    <span className="text-4xl font-bold">KES {estimate.maxKes.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Typical job: {estimate.typicalDays} day{estimate.typicalDays !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{estimate.note}</p>
                  </div>
                  <p className="text-sm font-medium mb-3">Price depends on:</p>
                  <ul className="space-y-2">
                    {estimate.factors.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="bg-card border rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">Ready to get real quotes?</p>
                  <p className="text-sm text-muted-foreground">Post your job and receive competitive quotes from verified pros.</p>
                </div>
                <Button asChild className="flex-shrink-0">
                  <Link href={`/jobs/new?trade=${trade}&location=${location}`}>
                    Post Job <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
