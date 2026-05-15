import { Home, List, Trophy, Flame, User } from "lucide-react";

export function BottomNav({ activeTab }: { activeTab: string }) {
  const tabs = [
    { id: "today", label: "Today", icon: Home },
    { id: "feed", label: "Feed", icon: List },
    { id: "leaderboard", label: "Rank", icon: Trophy },
    { id: "stakes", label: "Stakes", icon: Flame },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-zinc-950/95 backdrop-blur border-t border-zinc-900 flex items-center justify-around px-2 pb-5 z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <div key={tab.id} className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive ? "text-emerald-500" : "text-zinc-500"}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
}
