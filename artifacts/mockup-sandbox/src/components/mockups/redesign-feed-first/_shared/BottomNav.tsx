import { Activity, LayoutDashboard, Plus, Trophy, User } from "lucide-react";

export function BottomNav({ activeTab }: { activeTab: string }) {
  return (
    <div className="absolute bottom-0 inset-x-0 h-[88px] bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 pb-8 px-2 z-50">
      <div className="flex justify-around items-center h-full relative">
        <NavButton icon={Activity} label="Feed" active={activeTab === "feed"} />
        <NavButton icon={Trophy} label="Leaderboard" active={activeTab === "leaderboard"} />
        
        {/* Center FAB */}
        <div className="relative -top-5 flex flex-col items-center justify-center pointer-events-none">
          <button className="pointer-events-auto w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
            <Plus className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-medium text-zinc-400 mt-1 pointer-events-auto">Log</span>
        </div>

        <NavButton icon={LayoutDashboard} label="Stakes" active={activeTab === "stakes"} />
        <NavButton icon={User} label="Profile" active={activeTab === "profile"} />
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active }: { icon: any; label: string; active: boolean }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 w-16">
      <Icon className={`w-6 h-6 ${active ? "text-emerald-400" : "text-zinc-500"}`} />
      <span className={`text-[10px] font-medium ${active ? "text-emerald-400" : "text-zinc-500"}`}>
        {label}
      </span>
    </button>
  );
}
