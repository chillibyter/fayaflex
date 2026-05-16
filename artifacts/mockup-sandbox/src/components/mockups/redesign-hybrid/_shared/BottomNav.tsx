import { Home, Trophy, Plus, Target, User } from "lucide-react";

export function BottomNav({ activeTab }: { activeTab: string }) {
  return (
    <div className="absolute bottom-0 inset-x-0 h-[88px] bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 pb-8 px-2 z-50">
      <div className="flex justify-around items-center h-full relative">
        <NavButton icon={Home} label="Home" active={activeTab === "home"} />
        <NavButton icon={Trophy} label="Leaderboard" active={activeTab === "leaderboard"} />
        
        {/* Center FAB */}
        <div className="relative -top-5 flex flex-col items-center justify-center pointer-events-none">
          <button className="pointer-events-auto w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-transform">
            <Plus className="w-7 h-7" />
          </button>
        </div>

        <NavButton icon={Target} label="Stakes" active={activeTab === "stakes"} />
        <NavButton icon={User} label="Profile" active={activeTab === "profile"} />
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active }: { icon: any; label: string; active: boolean }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 w-16 group">
      <Icon className={`w-6 h-6 transition-colors ${active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-400"}`} />
      <span className={`text-[10px] font-medium transition-colors ${active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-400"}`}>
        {label}
      </span>
    </button>
  );
}