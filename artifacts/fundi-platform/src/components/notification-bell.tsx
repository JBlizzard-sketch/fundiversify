import { useState, useEffect } from "react";
import { Bell, BriefcaseBusiness, CheckCircle, Star, MessageSquare, X, ArrowRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const HOMEOWNER_ID = 1;
const CONTRACTOR_ID = 1;

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  new_quote:             { icon: <BriefcaseBusiness className="h-4 w-4" />, color: "text-blue-500 bg-blue-50" },
  quote_accepted:        { icon: <CheckCircle className="h-4 w-4" />,       color: "text-green-600 bg-green-50" },
  job_started:           { icon: <BriefcaseBusiness className="h-4 w-4" />, color: "text-violet-500 bg-violet-50" },
  job_completed:         { icon: <Star className="h-4 w-4" />,              color: "text-amber-500 bg-amber-50" },
  homeowner_confirmed:   { icon: <CheckCircle className="h-4 w-4" />,       color: "text-green-600 bg-green-50" },
  contractor_confirmed:  { icon: <CheckCircle className="h-4 w-4" />,       color: "text-green-600 bg-green-50" },
  default:               { icon: <MessageSquare className="h-4 w-4" />,     color: "text-muted-foreground bg-muted" },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
}

export function NotificationBell({ role }: { role: "homeowner" | "contractor" }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const userId = role === "homeowner" ? HOMEOWNER_ID : CONTRACTOR_ID;

  const queryKey = getListNotificationsQueryKey({ userId, userRole: role });

  const { data: notifications = [] } = useListNotifications(
    { userId, userRole: role },
    { query: { queryKey, refetchInterval: 15000 } }
  );

  const markRead = useMarkNotificationRead({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey }) },
  });

  const markAll = useMarkAllNotificationsRead({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey }) },
  });

  const unread = notifications.filter((n) => !n.read).length;

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Group notifications by day
  const grouped: { label: string; items: typeof notifications }[] = [];
  for (const n of notifications) {
    const label = dayLabel(n.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) last.items.push(n);
    else grouped.push({ label, items: [n] });
  }

  return (
    <>
      {/* Bell trigger */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          onClick={() => setOpen((o) => !o)}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none animate-pulse">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </div>

      {/* Slide-out panel */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[360px] max-w-[calc(100vw-32px)] flex flex-col bg-background border-l shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-base">Notifications</h2>
            {unread > 0 && (
              <Badge className="text-xs py-0 px-1.5 h-5">{unread} new</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate({ data: { userId, userRole: role } })}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
              <Inbox className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">All caught up!</p>
              <p className="text-xs mt-1">No notifications yet</p>
            </div>
          ) : (
            grouped.map(({ label, items }) => (
              <div key={label}>
                {/* Day header */}
                <div className="sticky top-0 z-10 px-5 py-2 bg-muted/70 backdrop-blur text-xs font-semibold text-muted-foreground border-b">
                  {label}
                </div>

                {items.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.default;
                  return (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-5 py-4 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${!n.read ? "bg-primary/[0.03]" : ""}`}
                      onClick={() => {
                        if (!n.read) markRead.mutate({ id: n.id });
                        if (n.jobId) setOpen(false);
                      }}
                    >
                      {/* Icon bubble */}
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${meta.color}`}>
                        {meta.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className={`text-sm font-medium leading-snug ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                        {n.jobId && (
                          <Link
                            href={`/jobs/${n.jobId}`}
                            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5 font-medium"
                          >
                            View job <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Notifications refresh every 15 seconds
          </p>
        </div>
      </div>
    </>
  );
}
