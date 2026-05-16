import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import { Plus, Flame, Heart, ChevronRight } from "lucide-react";

export function Stakes() {
  return (
    <MobileFrame>
      <div className="flex-1 bg-zinc-950 flex flex-col relative h-full">
        {/* Header */}
        <div className="pt-12 pb-4 px-4 bg-zinc-950 z-10 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Stakes</h1>
            <button className="flex items-center gap-1.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-full transition-colors">
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 border-b border-zinc-800">
            <button className="pb-3 text-sm font-semibold text-emerald-400 border-b-2 border-emerald-400 relative top-[1px]">Active</button>
            <button className="pb-3 text-sm font-semibold text-zinc-500">Pending</button>
            <button className="pb-3 text-sm font-semibold text-zinc-500">Past</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-4 pt-2">
          
          {/* Active Stake Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <div className="flex items-center justify-between mb-6 relative">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weekly Steps</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-[10px] font-bold text-zinc-300">
                4d 14h left
              </div>
            </div>
            
            <div className="flex justify-between items-end mb-6 relative">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
                  HH
                </div>
                <div className="text-xs font-bold">You</div>
                <div className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">-2.4k</div>
              </div>
              
              <div className="text-2xl font-black text-zinc-700 mb-6 italic px-2">VS</div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xl border border-zinc-700">
                  IB
                </div>
                <div className="text-xs font-bold">Iron Brigade</div>
                <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Leading</div>
              </div>
            </div>
            
            <div className="mb-5 relative">
               <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1">
                 <span>42% complete</span>
                 <span>58% complete</span>
               </div>
               <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800/50">
                  <div className="h-full bg-emerald-500" style={{ width: '42%' }}></div>
                  <div className="h-full bg-zinc-700" style={{ width: '58%' }}></div>
                </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4 relative">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-rose-500/10 flex items-center justify-center">
                  <Heart className="w-3 h-3 text-rose-400" />
                </div>
                <div className="text-xs text-zinc-400 font-medium">$50 to St. Jude</div>
              </div>
              <button className="text-xs font-bold text-white flex items-center gap-1">
                View <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          
        </div>
        
        <BottomNav activeTab="stakes" />
      </div>
    </MobileFrame>
  );
}