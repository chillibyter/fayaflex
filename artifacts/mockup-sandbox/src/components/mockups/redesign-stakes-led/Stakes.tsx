import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import "./_group.css";
import { Flame, Plus, Heart, Trophy } from "lucide-react";

export function Stakes() {
  return (
    <MobileFrame title="Stakes">
      <div className="flex flex-col h-full relative">
        <div className="px-4 py-3 bg-zinc-950/95 sticky top-0 z-30 border-b border-zinc-900 flex justify-between items-center pt-5">
          <div className="bg-zinc-900 p-1 rounded-xl flex text-sm font-semibold flex-1 mr-3">
            <button className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-100 shadow">Active</button>
            <button className="flex-1 py-1.5 rounded-lg text-zinc-400">Pending</button>
            <button className="flex-1 py-1.5 rounded-lg text-zinc-400">Past</button>
          </div>
          <button className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 p-4 pb-24 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Week 24 Showdown</span>
              </div>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">2d 14h left</span>
            </div>
            
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col items-center gap-2 w-24">
                  <div className="w-14 h-14 rounded-xl bg-emerald-900 border border-emerald-700 flex items-center justify-center text-lg font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]">HH</div>
                  <span className="text-xs font-bold text-center">Highlife Hustlers</span>
                  <span className="text-2xl font-black text-rose-500">42%</span>
                </div>
                
                <div className="text-sm font-black text-zinc-600">VS</div>
                
                <div className="flex flex-col items-center gap-2 w-24 opacity-60">
                  <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg font-black text-white">SS</div>
                  <span className="text-xs font-bold text-center">Squad Sweat</span>
                  <span className="text-2xl font-black text-zinc-100">58%</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-bold text-zinc-500">
                  <span>Team Progress</span>
                  <span className="text-rose-400">Behind Pace</span>
                </div>
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Stake</div>
                  <div className="text-sm font-bold text-zinc-200">$50 to charity for winner</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-2xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-400 mb-1">Highlife Hustlers Streak</div>
              <div className="text-xs text-zinc-400 leading-relaxed">You've won 3 stakes in a row. Don't break the streak to keep your team multiplier!</div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav activeTab="stakes" />
    </MobileFrame>
  );
}
