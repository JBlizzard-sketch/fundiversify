import { CheckCircle2, Circle, Clock, FileText, Handshake, PlayCircle, Star, ShieldAlert, XCircle } from "lucide-react";

interface JobTimelineProps {
  status: string;
  quoteCount: number;
  homeownerConfirmed: boolean;
  contractorConfirmed: boolean;
  createdAt: string;
  hasDispute: boolean;
  hasReview: boolean;
}

interface Step {
  key: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  state: "done" | "active" | "pending" | "skipped";
  timestamp?: string;
}

export function JobTimeline({
  status,
  quoteCount,
  homeownerConfirmed,
  contractorConfirmed,
  createdAt,
  hasDispute,
  hasReview,
}: JobTimelineProps) {
  const ORDER = ["open", "quoted", "in_progress", "completed"];
  const currentIdx = ORDER.indexOf(status);

  function stepState(stepKey: string, idx: number): "done" | "active" | "pending" | "skipped" {
    if (status === "cancelled") return "skipped";
    if (status === "disputed" && stepKey === "in_progress") return "active";
    if (idx < currentIdx) return "done";
    if (idx === currentIdx) return "active";
    return "pending";
  }

  const steps: Step[] = [
    {
      key: "open",
      label: "Job posted",
      sublabel: new Date(createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }),
      icon: FileText,
      state: stepState("open", 0),
    },
    {
      key: "quoted",
      label: quoteCount > 0 ? `${quoteCount} quote${quoteCount > 1 ? "s" : ""} received` : "Awaiting quotes",
      sublabel: quoteCount > 0 ? "Review and accept a quote to proceed" : undefined,
      icon: Clock,
      state: quoteCount > 0 && currentIdx >= 1 ? "done" : currentIdx >= 1 ? "done" : quoteCount > 0 ? "active" : stepState("quoted", 1),
    },
    {
      key: "in_progress",
      label: hasDispute ? "In progress (dispute raised)" : "Work in progress",
      sublabel: hasDispute ? "Dispute under review" : "Contractor working on the job",
      icon: hasDispute ? ShieldAlert : PlayCircle,
      state: stepState("in_progress", 2),
    },
    {
      key: "confirmed",
      label: homeownerConfirmed && contractorConfirmed
        ? "Both parties confirmed"
        : homeownerConfirmed
        ? "Homeowner confirmed — awaiting contractor"
        : contractorConfirmed
        ? "Contractor confirmed — awaiting homeowner"
        : "Completion confirmation",
      sublabel: !homeownerConfirmed && !contractorConfirmed ? "Both parties must confirm to complete" : undefined,
      icon: Handshake,
      state:
        homeownerConfirmed && contractorConfirmed ? "done" :
        homeownerConfirmed || contractorConfirmed ? "active" :
        currentIdx >= 2 ? "active" : "pending",
    },
    {
      key: "completed",
      label: status === "completed" ? "Job completed" : "Completion",
      sublabel: status === "completed" && hasReview ? "Review submitted" : status === "completed" ? "Awaiting review" : undefined,
      icon: status === "completed" ? (hasReview ? Star : CheckCircle2) : status === "cancelled" ? XCircle : CheckCircle2,
      state: status === "completed" ? "done" : status === "cancelled" ? "skipped" : "pending",
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isLast = i === steps.length - 1;
        const isDone = step.state === "done";
        const isActive = step.state === "active";
        const isSkipped = step.state === "skipped";

        return (
          <div key={step.key} className="flex gap-3">
            {/* Spine */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary/10 border-primary text-primary"
                    : isSkipped
                    ? "bg-muted border-muted-foreground/20 text-muted-foreground/40"
                    : "bg-muted border-border text-muted-foreground/30"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 my-1 min-h-[20px] rounded-full ${
                    isDone ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-5 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm font-medium leading-tight ${
                  isDone ? "text-foreground" : isActive ? "text-primary" : "text-muted-foreground/50"
                }`}
              >
                {step.label}
                {isActive && (
                  <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse align-middle" />
                )}
              </p>
              {step.sublabel && (
                <p className={`text-xs mt-0.5 ${isDone || isActive ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                  {step.sublabel}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
