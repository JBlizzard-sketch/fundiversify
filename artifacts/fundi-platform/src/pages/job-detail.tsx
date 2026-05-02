import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Clock, Briefcase, Star, ShieldCheck, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetJob,
  useUpdateQuote,
  useCreateQuote,
  getGetJobQueryKey,
} from "@workspace/api-client-react";

const CONTRACTOR_ID = 2;

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const queryClient = useQueryClient();
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteDays, setQuoteDays] = useState("3");

  const { data: job, isLoading } = useGetJob(id, {
    query: { enabled: !!id, queryKey: getGetJobQueryKey(id) },
  });

  const updateQuote = useUpdateQuote({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) }),
    },
  });

  const createQuote = useCreateQuote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) });
        setQuoteAmount(""); setQuoteMessage(""); setQuoteDays("3");
      },
    },
  });

  if (isLoading) return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Skeleton className="h-64 w-full rounded-xl mb-4" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );

  if (!job) return (
    <div className="container mx-auto px-4 py-10 text-center">
      <p className="text-muted-foreground">Job not found.</p>
      <Button asChild variant="ghost" className="mt-4"><Link href="/jobs">Back to Jobs</Link></Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href="/jobs"><ArrowLeft className="h-4 w-4 mr-2" />Back to Jobs</Link>
      </Button>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1 text-primary font-medium"><Briefcase className="h-3.5 w-3.5" />{job.trade}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(job.createdAt).toLocaleDateString("en-KE")}</span>
              </div>
            </div>
            <Badge variant={job.status === "open" ? "default" : "secondary"} className="capitalize">
              {job.status.replace("_", " ")}
            </Badge>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-4">{job.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-y">
            {job.estimatedBudget && (
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="font-semibold">KES {job.estimatedBudget.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Urgency</p>
              <p className="font-semibold capitalize">{job.urgency.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Posted by</p>
              <p className="font-semibold">{job.homeownerName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quotes ({job.quotes?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {job.quotes && job.quotes.length > 0 ? job.quotes.map((quote) => (
            <div key={quote.id} className={`p-4 rounded-lg border ${quote.status === "accepted" ? "border-primary bg-primary/5" : "bg-muted/30"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={quote.contractorAvatarUrl ?? ""} />
                    <AvatarFallback>{quote.contractorName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{quote.contractorName}</span>
                      {quote.contractorTier === "pro" && <Badge className="text-xs py-0">Pro</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {quote.contractorRating.toFixed(1)} · {quote.estimatedDays} days
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">KES {quote.amount.toLocaleString()}</p>
                  {quote.status === "accepted" ? (
                    <span className="text-xs text-primary font-medium flex items-center gap-1 justify-end"><CheckCircle className="h-3 w-3" />Accepted</span>
                  ) : job.status === "open" || job.status === "quoted" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1"
                      onClick={() => updateQuote.mutate({ id: quote.id, data: { status: "accepted" } })}
                      disabled={updateQuote.isPending}
                    >
                      Accept Quote
                    </Button>
                  ) : null}
                </div>
              </div>
              {quote.message && <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{quote.message}</p>}
            </div>
          )) : (
            <p className="text-muted-foreground text-sm text-center py-4">No quotes yet — be the first to quote!</p>
          )}
        </CardContent>
      </Card>

      {/* Submit Quote */}
      {job.status === "open" || job.status === "quoted" ? (
        <Card>
          <CardHeader><CardTitle>Submit Your Quote</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Your Price (KES)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. 8500"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Estimated Days</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. 3"
                  value={quoteDays}
                  onChange={(e) => setQuoteDays(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message (optional)</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                rows={3}
                placeholder="Describe your approach, experience with similar jobs..."
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
              />
            </div>
            <Button
              disabled={!quoteAmount || createQuote.isPending}
              onClick={() => {
                if (!quoteAmount) return;
                createQuote.mutate({
                  data: {
                    jobId: id,
                    contractorId: CONTRACTOR_ID,
                    amount: parseFloat(quoteAmount),
                    message: quoteMessage || undefined,
                    estimatedDays: parseInt(quoteDays, 10) || 3,
                  },
                });
              }}
            >
              {createQuote.isPending ? "Submitting..." : "Submit Quote"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
