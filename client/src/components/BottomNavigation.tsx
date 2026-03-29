import { useLocation, Link } from "wouter";
import { Home, Dumbbell, User, Rss, Users } from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/feed", label: "Feed", icon: Rss },
  { path: "/teams", label: "Teams", icon: Users },
  { path: "/track", label: "Track", icon: Dumbbell },
  { path: "/profile", label: "Profile", icon: User },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-screen-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[72px] transition-colors cursor-pointer select-none ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:text-foreground"
              }`}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`h-6 w-6 ${active ? "stroke-[2.5px]" : ""}`} />
              <span className={`text-xs ${active ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
