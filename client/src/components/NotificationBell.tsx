import { Link } from "wouter";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function NotificationBell({ className = "" }: { className?: string }) {
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/app-notifications/unread-count"],
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const count = data?.count ?? 0;

  return (
    <Link href="/notifications">
      <Button
        size="icon"
        variant="ghost"
        className={`relative ${className}`}
        data-testid="button-notification-bell"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none"
            data-testid="text-unread-badge"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>
    </Link>
  );
}
