import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import { Flame, Trophy, Map, Heart, MessageCircle, MoreHorizontal } from "lucide-react";

export function Home() {
  return (
    <MobileFrame>
      <div className="flex-1 bg-zinc-950 flex flex-col relative h-full">
        {/* Sticky Pulse Strip */}
        <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 pt-10 pb-3 px-4">
          <div className="flex items-center gap-3">
            {/* Left: Team Rank */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 flex flex-col items-center justify-center shrink-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Rank</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold">#2</span>
                <span className="text-xs text-emerald-400 font-bold">↑1</span>
              </div>
            </div>
            
            {/* Middle: Active Stake */}
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 overflow-hidden relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-zinc-300 truncate pr-2">vs Iron Brigade</span>
                <span className="text-[10px] font-semibold text-zinc-500 shrink-0">4d left</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-[42%]" />
                </div>
                <span className="text-[10px] font-bold text-rose-400 shrink-0">-2.4k</span>
              </div>
            </div>
            
            {/* Right: Daily Ring */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 flex items-center justify-center shrink-0 relative w-[52px] h-[52px]">
               <svg className="w-10 h-10 transform -rotate-90">
                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-800" />
                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="100" strokeDashoffset="18" className="text-emerald-500" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-28 pt-4 px-4 space-y-4">
          
          {/* Workout Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                  JD
                </div>
                <div>
                  <div className="text-sm"><span className="font-bold text-white">Jordan</span> <span className="text-zinc-400">ran</span></div>
                  <div className="text-xs text-zinc-500">2h ago</div>
                </div>
              </div>
              <button className="text-zinc-500"><MoreHorizontal className="w-5 h-5" /></button>
            </div>
            
            <div className="text-base font-bold mb-3">Morning 5K Push</div>
            
            <div className="flex gap-4 mb-3">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Dist</div>
                <div className="font-semibold text-lg">5.2<span className="text-xs text-zinc-400 font-medium ml-0.5">km</span></div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Pace</div>
                <div className="font-semibold text-lg">5:12<span className="text-xs text-zinc-400 font-medium ml-0.5">/km</span></div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Time</div>
                <div className="font-semibold text-lg">27:04</div>
              </div>
            </div>
            
            <div className="h-20 bg-zinc-950 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center border border-zinc-800/50">
               <svg viewBox="0 0 100 40" className="w-full h-full stroke-emerald-500 fill-none stroke-[2.5] stroke-linecap-round stroke-linejoin-round relative z-10 px-6 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]">
                  <path d="M 0 35 Q 15 35, 20 20 T 40 10 T 60 25 T 80 15 T 100 20" />
                </svg>
            </div>
            
            <div className="flex items-center gap-4 pt-1">
              <button className="flex items-center gap-1.5 text-zinc-400 hover:text-rose-400 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-xs font-bold">12</span>
              </button>
              <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-bold">4</span>
              </button>
            </div>
          </div>
          
          {/* Stake Update Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
             <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Stake Alert</span>
              </div>
              <span className="text-xs text-zinc-500">4h ago</span>
            </div>
            <div className="text-sm text-zinc-300 leading-relaxed mb-3">
              <span className="font-bold text-white">Iron Brigade</span> just pulled ahead by <span className="font-bold text-rose-400">2.4k steps</span>. Rally the squad!
            </div>
            <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden flex mb-4">
              <div className="h-full bg-rose-500" style={{ width: '42%' }}></div>
              <div className="h-full bg-zinc-700" style={{ width: '58%' }}></div>
            </div>
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
              View Stake Details
            </button>
          </div>
          
          {/* Milestone Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm"><span className="font-bold text-white">Sarah</span> <span className="text-zinc-400">hit a milestone</span></div>
                <div className="text-xs text-zinc-500">Yesterday</div>
              </div>
            </div>
            <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800/50 mb-3 flex items-center gap-3">
              <div className="text-3xl font-black text-amber-500 tabular-nums tracking-tighter">14</div>
              <div>
                <div className="font-bold text-white text-sm">Day Streak!</div>
                <div className="text-xs text-zinc-400">Logged activity for 2 weeks straight.</div>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <button className="flex items-center gap-1.5 text-zinc-400 hover:text-rose-400 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-xs font-bold">8</span>
              </button>
              <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-bold">1</span>
              </button>
            </div>
          </div>
          
        </div>
        <BottomNav activeTab="home" />
      </div>
    </MobileFrame>
  );
}