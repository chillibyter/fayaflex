import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Bell, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { initPushNotifications, sendTestPush, getPushStatus, type PushStatus } from "@/lib/pushNotifications";

type Prefs = {
  dailyReminder: boolean;
  teamMessage: boolean;
  reaction: boolean;
  comment: boolean;
  directMessage: boolean;
  monthlyWinner: boolean;
  rankChange: boolean;
};

const ITEMS: { key: keyof Prefs; label: string; description: string }[] = [
  { key: "dailyReminder", label: "Daily reminders", description: "A nudge if you haven't logged any activity today." },
  { key: "teamMessage", label: "Team messages", description: "When a teammate posts in your team chat." },
  { key: "reaction", label: "Reactions", description: "When someone reacts to your activity." },
  { key: "comment", label: "Comments", description: "When someone comments on your activity." },
  { key: "directMessage", label: "Direct messages", description: "When a teammate sends you a private message." },
  { key: "monthlyWinner", label: "Monthly winners", description: "When the monthly champion is announced." },
  { key: "rankChange", label: "Rank changes", description: "When your position on the leaderboard moves." },
];

export default function NotificationSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [local, setLocal] = useState<Prefs | null>(null);
  const [pushStatus, setPushStatus] = useState<PushStatus>(() => getPushStatus());

  useEffect(() => {
    const onUpdate = (e: Event) => setPushStatus((e as CustomEvent<PushStatus>).detail);
    window.addEventListener("fayaflex:push-status", onUpdate as EventListener);
    return () => window.removeEventListener("fayaflex:push-status", onUpdate as EventListener);
  }, []);

  const { data, isLoading } = useQuery<Prefs>({ queryKey: ["/api/notifications/preferences"] });

  useEffect(() => {
    if (data && !local) setLocal(data);
  }, [data, local]);

  const saveMutation = useMutation({
    mutationFn: async (next: Partial<Prefs>) => apiRequest("PATCH", "/api/notifications/preferences", next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
    },
    onError: (err: any) => {
      toast({ title: "Couldn't save", description: err.message || "Try again", variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await sendTestPush();
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.success === false || data?.tokenCount === 0) {
        toast({
          title: "No device registered",
          description:
            data?.message ||
            "This device hasn't sent its push token yet. Tap Enable, allow the prompt, then try again.",
          variant: "destructive",
        });
        return;
      }
      const platforms: string[] = data?.platforms || [];
      const summary =
        platforms.length > 0
          ? `Delivered to ${data.tokenCount} device${data.tokenCount === 1 ? "" : "s"} (${platforms.join(", ")}).`
          : `Delivered to ${data.tokenCount} device${data.tokenCount === 1 ? "" : "s"}.`;
      toast({
        title: "Test sent",
        description: `${summary} On iOS the banner won't show while the app is open — background it or lock the screen first.`,
      });
    },
    onError: (err: any) => toast({ title: "Test failed", description: err.message || "Try again", variant: "destructive" }),
  });

  const toggle = (key: keyof Prefs, value: boolean) => {
    if (!local) return;
    const next = { ...local, [key]: value };
    setLocal(next);
    saveMutation.mutate({ [key]: value } as Partial<Prefs>);
  };

  const enableOnDevice = async () => {
    await initPushNotifications();
    setPushStatus(getPushStatus());
    const s = getPushStatus();
    if (s.registered) {
      toast({ title: "Notifications enabled", description: "You're all set." });
    } else if (s.permission === "denied") {
      toast({
        title: "Permission denied",
        description: "Open your device settings → FayaFlex → Notifications to enable.",
        variant: "destructive",
      });
    } else if (s.lastError) {
      toast({ title: "Couldn't enable notifications", description: s.lastError, variant: "destructive" });
    } else {
      toast({
        title: "Still setting up",
        description: "If nothing happens in a few seconds, try again or check your device's notification settings.",
      });
    }
  };

  const statusLabel = (() => {
    if (pushStatus.registered) {
      return { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", text: `Registered on this device (${pushStatus.platform}).` };
    }
    if (pushStatus.permission === "denied") {
      return { icon: XCircle, color: "text-destructive", text: "Permission denied — enable in your device settings." };
    }
    if (pushStatus.permission === "unsupported") {
      return { icon: XCircle, color: "text-muted-foreground", text: "This browser doesn't support push notifications." };
    }
    if (pushStatus.lastError) {
      return { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", text: pushStatus.lastError };
    }
    return { icon: AlertTriangle, color: "text-muted-foreground", text: "Not yet enabled on this device." };
  })();
  const StatusIcon = statusLabel.icon;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => setLocation("/notifications")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Notification settings</h1>
      </header>

      <div className="p-4 space-y-4 max-w-xl mx-auto">
        <Card className="p-4 flex items-start gap-3">
          <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <div className="font-medium mb-1">Enable on this device</div>
            <p className="text-sm text-muted-foreground mb-3">
              First time? Tap below to allow push notifications, then choose what you want to hear about.
            </p>
            <div
              className={`flex items-start gap-2 text-sm mb-3 ${statusLabel.color}`}
              data-testid="text-push-status"
            >
              <StatusIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="flex-1 break-words">{statusLabel.text}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={enableOnDevice} data-testid="button-enable-device">
                {pushStatus.registered ? "Re-register" : "Enable"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending} data-testid="button-test-push">
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send test"}
              </Button>
            </div>
          </div>
        </Card>

        {isLoading || !local ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Card className="divide-y">
            {ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={local[item.key]}
                  onCheckedChange={(v) => toggle(item.key, v)}
                  data-testid={`switch-${item.key}`}
                />
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
