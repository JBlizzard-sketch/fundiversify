import { useState } from "react";
import { Bell, BriefcaseBusiness, CheckCircle, Star, MessageSquare, X } from "lucide-react";
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

const TYPE_ICON: Record<string, React.ReactNode> = {
  new_quote: <BriefcaseBusiness className="h-4 w-4 text-blue-500" />,
  quote_accepted: <CheckCircle className="h-4 w-4 text-green-500" />,
  job_started: <BriefcaseBusiness className="h-4 w-4 text-violet-500" />,
  job_completed: <Star className="h-4 w-4 text-amber-500" />,
  homeowner_confirmed: <CheckCircle className="h-4 w-4 text-green-500" />,
  contractor_confirmed: <CheckCircle className="h-4 w-4 text-green-500" />,
  default: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
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

  return (
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
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border bg-background shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unread > 0 && <Badge className="text-xs py-0 px-1.5">{unread}</Badge>}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={() => markAll.mutate({ data: { userId, userRole: role } })}
                    className="text-xs text-primary hover:underline mr-2"
                  >
                    Mark all read
                  </button>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${!n.read ? "bg-primary/3" : ""}`}
                    onClick={() => {
                      if (!n.read) markRead.mutate({ id: n.id });
                      if (n.jobId) setOpen(false);
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {TYPE_ICON[n.type] ?? TYPE_ICON.default}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-snug ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
                        {n.jobId && (
                          <Link
                            href={`/jobs/${n.jobId}`}
                            onClick={() => setOpen(false)}
                            className="text-xs text-primary hover:underline"
                          >
                            View job →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
