import { useLocation, Link } from "wouter";
import { useState } from "react";
import { Home, User, Trophy, Users, Plus, RefreshCw, Loader2, Heart, PencilLine } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useQuery } from "@tanstack/react-query";
import LogActivityDialog from "@/components/LogActivityDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { healthService } from "@/lib/healthService";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const leftItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const rightItems = [
  { path: "/teams", label: "Teams", icon: Users },
  { path: "/profile", label: "Profile", icon: User },
];

type DeviceConnection = {
  provider: "apple_health" | "android_health" | "huawei_health" | "garmin_connect";
  isConnected: boolean;
};

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [logOpen, setLogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [emptyPromptOpen, setEmptyPromptOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);

  // We only consider the FAB "sync mode" on native platforms where the
  // health-service is actually wired up. On the web build (and inside the
  // Replit preview) the FAB always opens the manual log dialog.
  const isNative = Capacitor.isNativePlatform();

  const { data: devices = [] } = useQuery<DeviceConnection[]>({
    queryKey: ["/api/devices"],
    enabled: !!user,
  });

  const nativeHealthConnected = devices.some(
    (d) => d.isConnected && d.provider !== "garmin_connect"
  );
  const garminConnected = devices.some(
    (d) => d.isConnected && d.provider === "garmin_connect"
  );
  const syncMode = isNative && (nativeHealthConnected || garminConnected);

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const invalidateTodayQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
    queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/progress/chart"] });
    queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stakes/active"] });
  };

  const runDeviceSync = async () => {
    setSyncing(true);
    let foundData = false;
    try {
      // Native health (Apple / Android / Huawei): pull today's data via the
      // health-service and POST to the same /api/devices/sync endpoint used
      // by the background auto-sync hook.
      if (nativeHealthConnected) {
        const available = await healthService.isAvailable();
        const provider = available ? await healthService.getProviderName() : null;
        if (provider) {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setHours(0, 0, 0, 0);

          const [healthData, detailedWorkouts] = await Promise.all([
            healthService.getHealthData(startDate, endDate, (user as any)?.bmr),
            healthService.getDetailedWorkouts(1).catch(() => [] as any[]),
          ]);

          if (healthData.length > 0 || detailedWorkouts.length > 0) {
            const res = await apiRequest("POST", "/api/devices/sync", {
              provider,
              activities: healthData,
              workouts: detailedWorkouts,
            });
            if (res.ok) foundData = true;
          }
        }
      }

      // Garmin: server-side fetch for the past day.
      if (garminConnected) {
        try {
          const res = await apiRequest("POST", "/api/garmin/sync", { days: 1 });
          if (res.ok) {
            const body = await res.json().catch(() => ({} as any));
            if ((body?.synced ?? body?.created ?? 0) > 0) foundData = true;
          }
        } catch {
          // ignore — fall through to the empty-state prompt
        }
      }

      invalidateTodayQueries();

      if (foundData) {
        toast({
          title: "Synced",
          description: "Latest activity pulled from your device.",
        });
      } else {
        // Nothing came back from the device — give the user a manual escape hatch.
        setEmptyPromptOpen(true);
      }
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error?.message || "Couldn't reach your device.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleFabClick = () => {
    if (syncing) return;
    if (syncMode) {
      // User has at least one health source connected — keep the existing
      // one-tap sync behavior.
      runDeviceSync();
    } else if (isNative) {
      // Native build but nothing connected yet — show the new chooser so
      // the user can either connect a health source or log manually.
      setChooserOpen(true);
    } else {
      // Web build — no native health to connect to, go straight to manual.
      setLogOpen(true);
    }
  };

  const FabIcon = syncing ? Loader2 : syncMode ? RefreshCw : Plus;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div className="relative flex items-center justify-around h-16 max-w-screen-lg mx-auto">
          {leftItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors cursor-pointer select-none ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground active:text-foreground"
                }`}
                style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`h-6 w-6 ${active ? "stroke-[2.5px]" : ""}`} />
                <span className={`text-xs ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
              </Link>
            );
          })}

          {/* Center FAB — syncs from device when one is connected, otherwise opens the manual log dialog. */}
          <div className="flex flex-col items-center justify-center min-w-[72px]">
            <button
              type="button"
              onClick={handleFabClick}
              aria-label={syncMode ? "Sync from device" : "Log activity"}
              data-testid="button-log-activity"
              disabled={syncing}
              className="-mt-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active-elevate-2 disabled:opacity-80"
              style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            >
              <FabIcon className={`h-7 w-7 stroke-[2.5px] ${syncing ? "animate-spin" : ""}`} />
            </button>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
              {syncing ? "Syncing" : syncMode ? "Sync" : "Log"}
            </span>
          </div>

          {rightItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors cursor-pointer select-none ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground active:text-foreground"
                }`}
                style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`h-6 w-6 ${active ? "stroke-[2.5px]" : ""}`} />
                <span className={`text-xs ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <LogActivityDialog open={logOpen} onOpenChange={setLogOpen} />

      {/* First-time chooser shown when a native user taps Sync but hasn't
          connected any health source yet. */}
      <AlertDialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>How would you like to track?</AlertDialogTitle>
            <AlertDialogDescription>
              Connect your phone's health app to sync workouts automatically,
              or log this activity manually.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            <button
              type="button"
              onClick={() => {
                setChooserOpen(false);
                navigate("/health-data");
              }}
              data-testid="button-chooser-connect-health"
              className="flex items-start gap-3 p-3 rounded-md border hover-elevate text-left"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">Connect Health</p>
                <p className="text-xs text-muted-foreground">
                  Sync steps, calories &amp; workouts from your phone
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setChooserOpen(false);
                setLogOpen(true);
              }}
              data-testid="button-chooser-log-manual"
              className="flex items-start gap-3 p-3 rounded-md border hover-elevate text-left"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <PencilLine className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">Log Workout Manually</p>
                <p className="text-xs text-muted-foreground">
                  Enter today's activity yourself
                </p>
              </div>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-chooser-cancel">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={emptyPromptOpen} onOpenChange={setEmptyPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No new workout data</AlertDialogTitle>
            <AlertDialogDescription>
              We didn't find any new activity on your connected device for today. Want to log it manually?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-empty-cancel">Not now</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEmptyPromptOpen(false);
                setLogOpen(true);
              }}
              data-testid="button-empty-log-manually"
            >
              Log manually
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
