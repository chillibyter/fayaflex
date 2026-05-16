import { useLocation, Link } from "wouter";
import { useState } from "react";
import { Home, User, Trophy, Target, Plus } from "lucide-react";
import LogActivityDialog from "@/components/LogActivityDialog";

const leftItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const rightItems = [
  { path: "/stakes", label: "Stakes", icon: Target },
  { path: "/profile", label: "Profile", icon: User },
];

export default function BottomNavigation() {
  const [location] = useLocation();
  const [logOpen, setLogOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

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

          {/* Center FAB — opens the log-activity dialog */}
          <div className="flex flex-col items-center justify-center min-w-[72px]">
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              aria-label="Log activity"
              data-testid="button-log-activity"
              className="-mt-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active-elevate-2"
              style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            >
              <Plus className="h-7 w-7 stroke-[2.5px]" />
            </button>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Log</span>
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
    </>
  );
}
