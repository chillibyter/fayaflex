import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import { Flame, Trophy, Plus, Settings } from "lucide-react";

export function Stakes() {
  return (
    <MobileFrame>
      <div className="flex-1 bg-zinc-950 flex flex-col relative">
        <div className="h-14 pt-2 px-4 flex items-center justify-between z-10 bg-zinc-950">
          <div className="font-bold text-xl text-white">Stakes</div>
          <button className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Tab strip */}
        <div className="px-4 py-2 flex gap-6 border-b border-zinc-800">
          <button className="text-sm font-semibold text-white border-b-2 border-emerald-500 pb-2">Active</button>
          <button className="text-sm font-medium text-zinc-500 pb-2">Pending (1)</button>
          <button className="text-sm font-medium text-zinc-500 pb-2">Past</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-28 pt-4 px-4 space-y-4 hide-scrollbar">
          
          {/* Active Stake Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800/50 bg-gradient-to-r from-emerald-950/30 to-zinc-900">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Weekly Clash</div>
                  <div className="text-lg font-bold text-white">Highlife vs Iron Brigade</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-2xl font-bold text-white tabular-nums">4d</div>
                  <div className="text-xs text-zinc-400 uppercase tracking-wider">remaining</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                Loser posts a 30-sec workout video
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Team 1 (User's team) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-emerald-400">Highlife Hustlers</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">Leading</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-300 tabular-nums">142k / 200k</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[71%] rounded-full relative">
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              {/* Team 2 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">Iron Brigade</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-400 tabular-nums">118k / 200k</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-500 w-[59%] rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-zinc-950/50 border-t border-zinc-800/50 flex justify-between items-center">
               <div className="text-xs text-zinc-400">Target: 40k steps per member</div>
               <button className="text-sm font-medium text-emerald-400 hover:text-emerald-300">View Details</button>
            </div>
          </div>
          
        </div>

        <BottomNav activeTab="stakes" />
      </div>
    </MobileFrame>
  );
}
