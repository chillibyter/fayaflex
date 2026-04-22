import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  Settings,
  Loader2,
  CheckCheck,
  Trash2,
  Heart,
  MessageCircle,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

type AppNotif = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  data: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
};

function iconForType(type: string) {
  switch (type) {
    case "reaction":
      return Heart;
    case "comment":
      return MessageCircle;
    case "monthlyWinner":
      return Trophy;
    case "teamMessage":
      return Users;
    case "rankChange":
      return TrendingUp;
    case "directMessage":
      return Mail;
    case "dailyReminder":
      return Clock;
    default:
      return Bell;
  }
}

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<AppNotif[]>({
    queryKey: ["/api/app-notifications"],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/app-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/app-notifications/unread-count"] });
  };

  const markRead = useMutation({
    mutationFn: async (id: string) => apiRequest("POST", `/api/app-notifications/${id}/read`),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/app-notifications/read-all"),
    onSuccess: () => {
      invalidate();
      toast({ title: "All caught up", description: "Marked everything as read." });
    },
  });

  const deleteOne = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/app-notifications/${id}`),
    onSuccess: invalidate,
  });

  const clearAll = useMutation({
    mutationFn: async () => apiRequest("DELETE", "/api/app-notifications"),
    onSuccess: () => {
      invalidate();
      toast({ title: "Cleared", description: "Your notifications were cleared." });
    },
  });

  const handleClick = (n: AppNotif) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.link) setLocation(n.link);
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3 flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Notifications</h1>
        <Link href="/notifications/settings">
          <Button size="icon" variant="ghost" data-testid="button-notification-settings">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      <div className="p-4 space-y-3 max-w-xl mx-auto">
        {items.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" data-testid="text-unread-count">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="h-4 w-4 mr-1.5" />
                  Mark all read
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => clearAll.mutate()}
                disabled={clearAll.isPending}
                data-testid="button-clear-all"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-10 flex flex-col items-center text-center gap-3" data-testid="empty-notifications">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reactions, comments, team activity and reminders will show up here.
              </p>
            </div>
            <Link href="/notifications/settings">
              <Button size="sm" variant="outline" data-testid="button-go-settings">
                Notification settings
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="divide-y overflow-hidden">
            {items.map((n) => {
              const Icon = iconForType(n.type);
              return (
                <div
                  key={n.id}
                  className={`relative flex items-stretch ${!n.isRead ? "bg-primary/5" : ""}`}
                  data-testid={`notification-${n.id}`}
                >
                  <button
                    onClick={() => handleClick(n)}
                    className="flex-1 text-left flex items-start gap-3 p-4 hover-elevate active-elevate-2 min-w-0"
                    data-testid={`button-open-${n.id}`}
                  >
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                        !n.isRead ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight" data-testid={`text-title-${n.id}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2" data-testid={`text-body-${n.id}`}>
                        {n.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Delete notification"
                    onClick={() => deleteOne.mutate(n.id)}
                    className="self-center mr-2"
                    data-testid={`button-delete-${n.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
