import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";

type Notification = {
  id: string;
  message: string;
  type: string;
  date: string;
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  // Generate notifications mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/generate', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate notifications');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Auto-generate notifications on component mount
  useEffect(() => {
    generateMutation.mutate();
  }, []);

  // Check for midnight and refresh notifications
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // At midnight, refetch notifications (this will clear old ones and generate new)
      if (hours === 0 && minutes === 0) {
        setTimeout(() => {
          generateMutation.mutate();
        }, 1000); // Wait 1 second to ensure we're past midnight
      }
    };

    // Check every minute
    const interval = setInterval(checkMidnight, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-notification-count"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Daily Motivation</h3>
          <p className="text-xs text-muted-foreground">Your personalized fitness messages</p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No new messages today</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className="p-3 border-primary/20 bg-primary/5 hover-elevate"
                  data-testid={`notification-${notification.type}`}
                >
                  <p className="text-sm">{notification.message}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
