import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Clock, Briefcase, Star, CheckCircle, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRef, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetJob,
  useUpdateQuote,
  useCreateQuote,
  useGetJobMessages,
  useSendJobMessage,
  useConfirmJob,
  useGetJobReview,
  useCreateReview,
  getGetJobQueryKey,
  getGetJobMessagesQueryKey,
  getGetJobReviewQueryKey,
} from "@workspace/api-client-react";

const CONTRACTOR_ID = 2;
const HOMEOWNER_ID = 1;
const HOMEOWNER_NAME = "Alice Wanjiku";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 ${i <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const queryClient = useQueryClient();
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteDays, setQuoteDays] = useState("3");
  const [msgText, setMsgText] = useState("");
  const [activeRole, setActiveRole] = useState<"homeowner" | "contractor">("homeowner");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: job, isLoading } = useGetJob(id, {
    query: { enabled: !!id, queryKey: getGetJobQueryKey(id) },
  });

  const { data: messages = [] } = useGetJobMessages(id, {
    query: {
      enabled: !!id,
      queryKey: getGetJobMessagesQueryKey(id),
      refetchInterval: 8000,
    },
  });

  const { data: existingReview } = useGetJobReview(id, {
    query: {
      enabled: !!id && job?.status === "completed",
      queryKey: getGetJobReviewQueryKey(id),
      retry: false,
    },
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

  const sendMessage = useSendJobMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobMessagesQueryKey(id) });
        setMsgText("");
      },
    },
  });

  const confirmJob = useConfirmJob({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) }),
    },
  });

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobReviewQueryKey(id) });
        setReviewRating(0);
        setReviewComment("");
      },
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const canConfirmAsHomeowner = job.status === "in_progress" && !job.homeownerConfirmed;
  const canConfirmAsContractor = job.status === "in_progress" && !job.contractorConfirmed;

  // Find accepted quote to get contractor info
  const acceptedQuote = job.quotes?.find((q) => q.status === "accepted");

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href="/jobs"><ArrowLeft className="h-4 w-4 mr-2" />Back to Jobs</Link>
      </Button>

      {/* Job info */}
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

      {/* Leave a Review — shown when job is completed and no review submitted yet */}
      {job.status === "completed" && !existingReview && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Leave a Review
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Job completed! Share your experience with {acceptedQuote?.contractorName ?? "the contractor"}.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <StarPicker value={reviewRating} onChange={setReviewRating} />
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder="Describe the quality of work, punctuality, and professionalism..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <Button
              disabled={!reviewRating || !reviewComment.trim() || createReview.isPending}
              onClick={() => {
                if (!reviewRating || !reviewComment.trim()) return;
                const contractorId = acceptedQuote?.contractorId ?? CONTRACTOR_ID;
                createReview.mutate({
                  data: {
                    jobId: id,
                    contractorId,
                    homeownerId: HOMEOWNER_ID,
                    homeownerName: HOMEOWNER_NAME,
                    rating: reviewRating,
                    comment: reviewComment.trim(),
                    jobTitle: job.title,
                    jobTrade: job.trade,
                  },
                });
              }}
            >
              {createReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review submitted confirmation */}
      {job.status === "completed" && existingReview && (
        <Card className="mb-6 border-green-200 bg-green-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-green-800">Review submitted</p>
              <div className="flex gap-0.5 mt-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i <= existingReview.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{existingReview.comment}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion confirmation */}
      {job.status === "in_progress" && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Job Completion Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 text-sm flex-wrap">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${job.homeownerConfirmed ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                <CheckCircle className="h-3.5 w-3.5" />
                Homeowner {job.homeownerConfirmed ? "confirmed" : "pending"}
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${job.contractorConfirmed ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                <CheckCircle className="h-3.5 w-3.5" />
                Contractor {job.contractorConfirmed ? "confirmed" : "pending"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Both parties must confirm for the job to be marked complete and reviews to open.</p>
            <div className="flex gap-2 flex-wrap">
              {canConfirmAsHomeowner && (
                <Button size="sm" onClick={() => confirmJob.mutate({ id, data: { role: "homeowner" } })} disabled={confirmJob.isPending}>
                  Confirm as Homeowner
                </Button>
              )}
              {canConfirmAsContractor && (
                <Button size="sm" variant="outline" onClick={() => confirmJob.mutate({ id, data: { role: "contractor" } })} disabled={confirmJob.isPending}>
                  Confirm as Contractor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In-app messaging */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Job Thread
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-80 overflow-y-auto px-4 py-2 space-y-3">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No messages yet. Start the conversation!</p>
            ) : messages.map((m) => {
              const isMe = m.senderRole === activeRole;
              return (
                <div key={m.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {m.senderName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                    <div className={`px-3 py-2 rounded-xl text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.content}
                    </div>
                    <span className="text-xs text-muted-foreground px-1">
                      {m.senderName} · {new Date(m.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <Separator />
          <div className="p-4 space-y-3">
            <div className="flex gap-2 text-xs">
              <span className="text-muted-foreground self-center">Sending as:</span>
              {(["homeowner", "contractor"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-2.5 py-1 rounded-full font-medium capitalize transition-colors ${activeRole === role ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Type a message..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && msgText.trim()) {
                    e.preventDefault();
                    sendMessage.mutate({
                      id,
                      data: {
                        senderId: activeRole === "homeowner" ? HOMEOWNER_ID : CONTRACTOR_ID,
                        senderName: activeRole === "homeowner" ? HOMEOWNER_NAME : "Demo Contractor",
                        senderRole: activeRole,
                        content: msgText.trim(),
                      },
                    });
                  }
                }}
              />
              <Button
                size="icon"
                disabled={!msgText.trim() || sendMessage.isPending}
                onClick={() => {
                  if (!msgText.trim()) return;
                  sendMessage.mutate({
                    id,
                    data: {
                      senderId: activeRole === "homeowner" ? HOMEOWNER_ID : CONTRACTOR_ID,
                      senderName: activeRole === "homeowner" ? HOMEOWNER_NAME : "Demo Contractor",
                      senderRole: activeRole,
                      content: msgText.trim(),
                    },
                  });
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
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
                    <Button size="sm" variant="outline" className="mt-1" onClick={() => updateQuote.mutate({ id: quote.id, data: { status: "accepted" } })} disabled={updateQuote.isPending}>
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
      {(job.status === "open" || job.status === "quoted") && (
        <Card>
          <CardHeader><CardTitle>Submit Your Quote</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Your Price (KES)</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. 8500" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Estimated Days</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. 3" value={quoteDays} onChange={(e) => setQuoteDays(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message (optional)</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} placeholder="Describe your approach, experience with similar jobs..." value={quoteMessage} onChange={(e) => setQuoteMessage(e.target.value)} />
            </div>
            <Button
              disabled={!quoteAmount || createQuote.isPending}
              onClick={() => {
                if (!quoteAmount) return;
                createQuote.mutate({ data: { jobId: id, contractorId: CONTRACTOR_ID, amount: parseFloat(quoteAmount), message: quoteMessage || undefined, estimatedDays: parseInt(quoteDays, 10) || 3 } });
              }}
            >
              {createQuote.isPending ? "Submitting..." : "Submit Quote"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
