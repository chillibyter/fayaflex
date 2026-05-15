import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import "./_group.css";
import { Flame, ChevronRight, Activity, TrendingUp } from "lucide-react";

export function Today() {
  return (
    <MobileFrame title="Today">
      <div className="pb-24 flex flex-col gap-4 p-4">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-emerald-900/80 to-zinc-900 border border-emerald-800/50 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-[10px] font-bold">HH</div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Highlife Hustlers</span>
          </div>
          
          <div className="text-2xl font-bold mb-1">Rank #2 <span className="text-zinc-400 text-lg font-medium">of 15</span></div>
          <div className="text-sm text-zinc-300 flex items-center gap-1 mb-5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Up 1 spot this week</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {['JD', 'AM', 'TB', 'RK'].map((initials, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-emerald-900 flex items-center justify-center text-xs font-bold z-10 relative">
                  {initials}
                </div>
              ))}
            </div>
            <button className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-1">
              Team Page <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        {/* Active Stake Widget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Active Stake</span>
            </div>
            <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-1 rounded">2d 14h left</span>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-900 flex items-center justify-center text-sm font-bold border border-emerald-700">HH</div>
              <div className="text-sm font-bold">Highlife Hustlers</div>
            </div>
            <div className="text-xl font-black text-rose-500">42%</div>
          </div>
          
          <div className="flex items-center justify-between mb-4 opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold border border-zinc-700">SS</div>
              <div className="text-sm font-bold">Squad Sweat</div>
            </div>
            <div className="text-xl font-black text-zinc-100">58%</div>
          </div>
          
          <div className="mb-4">
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }}></div>
            </div>
          </div>
          
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex flex-col items-center text-center">
            <span className="text-rose-400 font-bold text-sm mb-2">Behind by 2,400 steps</span>
            <button className="w-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold py-2 rounded-lg transition-colors">
              Log a workout to catch up
            </button>
          </div>
        </div>
        
        {/* Daily Goal */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="175" strokeDashoffset="35" className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" strokeLinecap="round" />
            </svg>
            <Activity className="w-6 h-6 text-emerald-500 absolute" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Daily Goal</div>
            <div className="text-xl font-bold"><span className="text-zinc-100">8,247</span> <span className="text-zinc-500 text-lg">/ 10k steps</span></div>
          </div>
        </div>
        
        {/* Feed Snippet */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold">Team Activity</span>
            <span className="text-xs font-semibold text-emerald-500">See all</span>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0">AM</div>
              <div>
                <div className="text-sm font-medium text-zinc-300">Amara completed a 5k run</div>
                <div className="text-xs text-zinc-500 mt-0.5">2 hours ago</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0">TB</div>
              <div>
                <div className="text-sm font-medium text-zinc-300">Tom logged a strength workout</div>
                <div className="text-xs text-zinc-500 mt-0.5">4 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav activeTab="today" />
    </MobileFrame>
  );
}
