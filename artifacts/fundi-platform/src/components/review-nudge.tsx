import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Star, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompletedJob {
  id: number;
  title: string;
  trade: string;
}

interface ReviewNudgeProps {
  completedJobs: CompletedJob[];
}

const STORAGE_KEY = "fv_review_nudge_dismissed";

function getDismissed(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function dismiss(jobId: number) {
  const s = getDismissed();
  s.add(jobId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
}

export function ReviewNudge({ completedJobs }: ReviewNudgeProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [hoverRating, setHoverRating] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setDismissed(getDismissed());
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const pending = completedJobs.filter((j) => !dismissed.has(j.id));
  const job = pending[0];

  function close() {
    if (job) {
      dismiss(job.id);
      setDismissed(getDismissed());
    }
    setVisible(false);
    setTimeout(() => setVisible(true), 100);
  }

  if (!visible || !job) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[150] w-80 bg-background border rounded-2xl shadow-2xl"
      style={{ animation: "nudge-in 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      <div className="flex items-start justify-between p-4 pb-2">
        <div>
          <p className="font-semibold text-sm">How was the job?</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{job.title}</p>
        </div>
        <button
          onClick={close}
          className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors flex-shrink-0 ml-2"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 pb-2">
        <div className="flex gap-1 my-2">
          {[1,2,3,4,5].map((i) => (
            <button
              key={i}
              onMouseEnter={() => setHoverRating(i)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={close}
              className="transition-transform hover:scale-110"
            >
              <Star className={`h-7 w-7 ${i <= hoverRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"} transition-colors`} />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-3">Tap a star to start, then write a full review</p>
      </div>

      <div className="border-t flex">
        <button
          onClick={close}
          className="flex-1 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Remind me later
        </button>
        <div className="w-px bg-border" />
        <Link href={`/jobs/${job.id}`} onClick={close} className="flex-1 py-2.5 text-xs text-primary font-medium hover:bg-primary/5 flex items-center justify-center gap-1 transition-colors rounded-br-2xl">
          Leave Review <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <style>{`
        @keyframes nudge-in {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
