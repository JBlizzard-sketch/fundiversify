import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Clock, Briefcase, Star, CheckCircle, Send, MessageSquare, AlertTriangle, X, ShieldAlert, ChevronRight, LayoutGrid, List, Trophy, Zap, TrendingDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRef, useState, useEffect } from "react";
import { Confetti } from "@/components/confetti";
import { JobTimeline } from "@/components/job-timeline";
import { usePageMeta } from "@/hooks/use-page-meta";
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
  useCreateDispute,
  getGetJobQueryKey,
  getGetJobMessagesQueryKey,
  getGetJobReviewQueryKey,
} from "@workspace/api-client-react";

const CONTRACTOR_ID = 2;
const HOMEOWNER_ID = 1;
const HOMEOWNER_NAME = "Alice Wanjiku";

const DISPUTE_REASONS = [
  { value: "payment_dispute", label: "Payment dispute" },
  { value: "work_quality", label: "Work quality not acceptable" },
  { value: "no_show", label: "Contractor did not show up" },
  { value: "incomplete_work", label: "Work left incomplete" },
  { value: "property_damage", label: "Property damaged during work" },
  { value: "other", label: "Other" },
];

const DISPUTE_STATUS_STEPS = [
  { key: "open", label: "Dispute Raised", desc: "Under initial review by FundiVerify" },
  { key: "under_review", label: "Under Review", desc: "Our mediation team is investigating" },
  { key: "resolved", label: "Resolved", desc: "Dispute has been closed" },
];

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
          <Star className={`h-8 w-8 ${i <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

function DisputeModal({
  jobId,
  jobTitle,
  onClose,
}: { jobId: number; jobTitle: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [raisedByRole, setRaisedByRole] = useState<"homeowner" | "contractor">("homeowner");

  const createDispute = useCreateDispute({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
        onClose();
      },
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold">Raise a Dispute</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            Filing a dispute for: <span className="font-medium text-foreground">{jobTitle}</span>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">I am raising this as</label>
            <div className="flex gap-2">
              {(["homeowner", "contractor"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRaisedByRole(role)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-colors ${raisedByRole === role ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select a reason...</option>
              {DISPUTE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description *</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={4}
              placeholder="Describe what happened in detail. Include dates, amounts, and any evidence you have..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>Raising a dispute will pause the job and notify both parties. Our mediation team reviews disputes within 24–48 hours.</span>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={!reason || !description.trim() || createDispute.isPending}
            onClick={() => {
              const name = raisedByRole === "homeowner" ? HOMEOWNER_NAME : "Demo Contractor";
              const id = raisedByRole === "homeowner" ? HOMEOWNER_ID : CONTRACTOR_ID;
              createDispute.mutate({
                data: {
                  jobId,
                  raisedById: id,
                  raisedByName: name,
                  reason,
                  description: description.trim(),
                },
              });
            }}
          >
            {createDispute.isPending ? "Submitting..." : "Submit Dispute"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DisputeTimeline({ dispute }: { dispute: { status: string; reason: string; description?: string | null; resolution?: string | null; raisedByName: string; createdAt: string } }) {
  const currentStep = DISPUTE_STATUS_STEPS.findIndex((s) => s.key === dispute.status);
  const isResolved = dispute.status === "resolved";

  return (
    <Card className="mb-6 border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-red-700">
          <ShieldAlert className="h-4 w-4" />
          Active Dispute
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Raised by <span className="font-medium">{dispute.raisedByName}</span> · {new Date(dispute.createdAt).toLocaleDateString("en-KE")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <p className="font-medium capitalize mb-0.5">{dispute.reason.replace(/_/g, " ")}</p>
          {dispute.description && <p className="text-muted-foreground">{dispute.description}</p>}
        </div>

        {/* Status timeline */}
        <div className="space-y-0">
          {DISPUTE_STATUS_STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep || isResolved;
            const isFuture = i > currentStep && !isResolved;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border-2 transition-colors ${isDone ? "bg-green-500 border-green-500 text-white" : isActive ? "bg-red-500 border-red-500 text-white animate-pulse" : "bg-background border-muted-foreground/30 text-muted-foreground"}`}>
                    {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < DISPUTE_STATUS_STEPS.length - 1 && (
                    <div className={`w-0.5 h-6 mt-0.5 ${isDone ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium leading-tight ${isFuture ? "text-muted-foreground/50" : ""}`}>{step.label}</p>
                  <p className={`text-xs mt-0.5 ${isFuture ? "text-muted-foreground/40" : "text-muted-foreground"}`}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {dispute.resolution && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
            <p className="font-medium text-green-800 mb-1">Resolution</p>
            <p className="text-green-700">{dispute.resolution}</p>
          </div>
        )}
      </CardContent>
    </Card>
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
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: job, isLoading } = useGetJob(id, {
    query: { enabled: !!id, queryKey: getGetJobQueryKey(id) },
  });

  usePageMeta(job ? job.title : "Job Details", job ? `${job.trade} job in ${job.location} — view quotes, messages and status on FundiVerify.` : undefined);

  useEffect(() => {
    const current = job?.status;
    if (prevStatusRef.current !== undefined && prevStatusRef.current !== "completed" && current === "completed") {
      setConfettiActive(true);
      const t = setTimeout(() => setConfettiActive(false), 5500);
      return () => clearTimeout(t);
    }
    prevStatusRef.current = current;
  }, [job?.status]);

  const { data: messages = [] } = useGetJobMessages(id, {
    query: {
      enabled: !!id,
      queryKey: getGetJobMessagesQueryKey(id),
      refetchInterval: 3000,
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
  const acceptedQuote = job.quotes?.find((q: { status: string }) => q.status === "accepted");
  const canRaiseDispute = (job.status === "in_progress" || job.status === "quoted") && !job.dispute;

  const statusColor: Record<string, string> = {
    open: "bg-blue-50 text-blue-700 border-blue-200",
    quoted: "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-violet-50 text-violet-700 border-violet-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    disputed: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Confetti active={confettiActive} />
      {showDisputeModal && (
        <DisputeModal
          jobId={id}
          jobTitle={job.title}
          onClose={() => setShowDisputeModal(false)}
        />
      )}

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
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${statusColor[job.status] ?? "bg-muted text-muted-foreground"}`}>
              {job.status.replace("_", " ")}
            </span>
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

          {canRaiseDispute && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Having a problem with this job?</p>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowDisputeModal(true)}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                Raise a Dispute
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity timeline */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <JobTimeline
            status={job.status}
            quoteCount={job.quoteCount}
            homeownerConfirmed={!!job.homeownerConfirmed}
            contractorConfirmed={!!job.contractorConfirmed}
            createdAt={job.createdAt}
            hasDispute={!!job.dispute}
            hasReview={!!existingReview}
          />
        </CardContent>
      </Card>

      {/* Dispute timeline */}
      {job.dispute && <DisputeTimeline dispute={job.dispute as any} />}

      {/* Leave a Review */}
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
            <p className="text-xs text-muted-foreground">Both parties must confirm for the job to be marked complete.</p>
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
          <div className="max-h-80 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : messages.map((m, idx) => {
              const isMe = m.senderRole === activeRole;
              const prevMsg = messages[idx - 1];
              const showAvatar = !prevMsg || prevMsg.senderRole !== m.senderRole;
              const showName = showAvatar;
              return (
                <div key={m.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${!showAvatar ? (isMe ? "mr-9" : "ml-9") : ""}`}>
                  {showAvatar ? (
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                      <AvatarFallback className={`text-xs font-semibold ${isMe ? "bg-primary/15 text-primary" : "bg-muted-foreground/15 text-muted-foreground"}`}>
                        {m.senderName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                    {showName && (
                      <span className="text-xs text-muted-foreground px-1 font-medium">{m.senderName}</span>
                    )}
                    <div className={`px-3.5 py-2 text-sm leading-relaxed break-words shadow-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                        : "bg-muted rounded-2xl rounded-tl-sm"
                    }`}>
                      {m.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {new Date(m.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 items-end">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-muted-foreground/15 text-muted-foreground">DC</AvatarFallback>
                </Avatar>
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  {[0,1,2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-muted-foreground/50"
                      style={{ animation: `typing-dot 1.2s ${i * 0.2}s infinite ease-in-out` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <style>{`
            @keyframes typing-dot {
              0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
              40% { transform: scale(1); opacity: 1; }
            }
          `}</style>
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
                    sendMessage.mutate({ id, data: { senderId: activeRole === "homeowner" ? HOMEOWNER_ID : CONTRACTOR_ID, senderName: activeRole === "homeowner" ? HOMEOWNER_NAME : "Demo Contractor", senderRole: activeRole, content: msgText.trim() } });
                  }
                }}
              />
              <Button size="icon" disabled={!msgText.trim() || sendMessage.isPending} onClick={() => {
                if (!msgText.trim()) return;
                sendMessage.mutate({ id, data: { senderId: activeRole === "homeowner" ? HOMEOWNER_ID : CONTRACTOR_ID, senderName: activeRole === "homeowner" ? HOMEOWNER_NAME : "Demo Contractor", senderRole: activeRole, content: msgText.trim() } });
                if (activeRole === "homeowner") { setIsTyping(true); setTimeout(() => setIsTyping(false), 2500); }
              }}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes */}
      {(() => {
        const quotes: any[] = job.quotes ?? [];
        const canAccept = job.status === "open" || job.status === "quoted";
        const lowestPrice = quotes.length > 1 ? Math.min(...quotes.map((q: any) => q.amount)) : null;
        const highestRating = quotes.length > 1 ? Math.max(...quotes.map((q: any) => q.contractorRating)) : null;
        const bestValue = quotes.length > 1
          ? quotes.reduce((best: any, q: any) => {
              const score = (q.contractorRating / 5) * 0.6 + (1 - q.amount / Math.max(...quotes.map((x: any) => x.amount))) * 0.4;
              const bScore = (best.contractorRating / 5) * 0.6 + (1 - best.amount / Math.max(...quotes.map((x: any) => x.amount))) * 0.4;
              return score > bScore ? q : best;
            }, quotes[0])
          : null;

        return (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Quotes ({quotes.length})</CardTitle>
                {quotes.length > 1 && (
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setCompareMode(false)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${!compareMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                    >
                      <List className="h-3.5 w-3.5" />List
                    </button>
                    <button
                      onClick={() => setCompareMode(true)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${compareMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />Compare
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No quotes yet — be the first to quote!</p>
              ) : compareMode ? (
                /* ── Compare grid ── */
                <div className="overflow-x-auto -mx-2 px-2">
                  <div className="flex gap-3 min-w-max pb-2">
                    {quotes.map((quote: any) => {
                      const isAccepted = quote.status === "accepted";
                      const isBestValue = bestValue?.id === quote.id;
                      const isLowest = lowestPrice !== null && quote.amount === lowestPrice;
                      const isTopRated = highestRating !== null && quote.contractorRating === highestRating;
                      return (
                        <div
                          key={quote.id}
                          className={`w-52 flex-shrink-0 rounded-xl border-2 p-4 flex flex-col gap-3 ${isAccepted ? "border-primary bg-primary/5" : isBestValue ? "border-amber-400 bg-amber-50/30" : "border-border bg-card"}`}
                        >
                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 min-h-[20px]">
                            {isAccepted && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" />Accepted</span>}
                            {isBestValue && !isAccepted && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Trophy className="h-3 w-3" />Best Value</span>}
                            {isLowest && !isBestValue && <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><TrendingDown className="h-3 w-3" />Lowest</span>}
                            {isTopRated && !isBestValue && !isLowest && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Star className="h-3 w-3" />Top Rated</span>}
                          </div>

                          {/* Contractor */}
                          <div className="flex items-center gap-2">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                              <AvatarImage src={quote.contractorAvatarUrl ?? ""} />
                              <AvatarFallback className="text-xs">{quote.contractorName.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{quote.contractorName}</p>
                              {quote.contractorTier === "pro" && <Badge className="text-xs py-0 px-1.5">Pro</Badge>}
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="space-y-2 text-sm border-t pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-xs">Price</span>
                              <span className="font-bold text-base text-primary">KES {quote.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-xs">Duration</span>
                              <span className="font-medium text-sm">{quote.estimatedDays}d</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-xs">Rating</span>
                              <span className="flex items-center gap-1 font-medium text-sm">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {quote.contractorRating.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-xs">Verified</span>
                              <ShieldCheck className={`h-4 w-4 ${quote.contractorVerified ? "text-primary" : "text-muted-foreground/30"}`} />
                            </div>
                          </div>

                          {/* Action */}
                          {!isAccepted && canAccept && (
                            <Button
                              size="sm"
                              className="w-full mt-1"
                              onClick={() => updateQuote.mutate({ id: quote.id, data: { status: "accepted" } })}
                              disabled={updateQuote.isPending}
                            >
                              Accept
                            </Button>
                          )}
                          {isAccepted && (
                            <Link href={`/contractors/${quote.contractorId}`}>
                              <Button size="sm" variant="outline" className="w-full mt-1">View Profile</Button>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── List view ── */
                <div className="space-y-3">
                  {quotes.map((quote: any) => {
                    const isAccepted = quote.status === "accepted";
                    const isBestValue = bestValue?.id === quote.id && quotes.length > 1;
                    return (
                      <div key={quote.id} className={`p-4 rounded-xl border-2 ${isAccepted ? "border-primary bg-primary/5" : isBestValue ? "border-amber-300 bg-amber-50/20" : "border-border bg-muted/20"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={quote.contractorAvatarUrl ?? ""} />
                              <AvatarFallback>{quote.contractorName.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{quote.contractorName}</span>
                                {quote.contractorTier === "pro" && <Badge className="text-xs py-0">Pro</Badge>}
                                {isBestValue && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Trophy className="h-3 w-3" />Best value</span>}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{quote.contractorRating.toFixed(1)}</span>
                                <span>{quote.estimatedDays} days</span>
                                {quote.contractorVerified && <span className="flex items-center gap-1 text-primary"><ShieldCheck className="h-3 w-3" />Verified</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-xl">KES {quote.amount.toLocaleString()}</p>
                            {isAccepted ? (
                              <span className="text-xs text-primary font-medium flex items-center gap-1 justify-end mt-1"><CheckCircle className="h-3 w-3" />Accepted</span>
                            ) : canAccept ? (
                              <Button size="sm" variant="outline" className="mt-1.5" onClick={() => updateQuote.mutate({ id: quote.id, data: { status: "accepted" } })} disabled={updateQuote.isPending}>
                                Accept Quote
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        {quote.message && <p className="text-sm text-muted-foreground mt-3 pt-3 border-t leading-relaxed">{quote.message}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

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
