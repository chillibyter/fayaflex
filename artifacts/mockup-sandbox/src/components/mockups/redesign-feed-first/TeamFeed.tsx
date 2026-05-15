import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import { Bell, Search, Map, Heart, MessageCircle, Flame, Trophy } from "lucide-react";

export function TeamFeed() {
  return (
    <MobileFrame>
      <div className="flex-1 bg-zinc-950 flex flex-col relative">
        {/* App Bar */}
        <div className="h-14 pt-2 px-4 flex items-center justify-between z-10 bg-zinc-950/80 backdrop-blur">
          <div className="font-bold text-xl text-white">Feed</div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Search className="w-5 h-5" />
            <Bell className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24 pt-2 px-4 space-y-4 hide-scrollbar">
          
          {/* Team Status Strip */}
          <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 font-bold text-lg">#2</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Highlife Hustlers</div>
                <div className="text-xs text-emerald-400 font-medium">+12 places this month</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">Vs Iron Brigade</div>
              <div className="text-sm font-bold text-white tabular-nums">4d 14h left</div>
            </div>
          </div>

          {/* Feed Cards */}
          
          {/* 1. Workout Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                MK
              </div>
              <div>
                <div className="text-sm text-zinc-300">
                  <span className="font-semibold text-white">Marcus</span> logged a workout
                </div>
                <div className="text-xs text-zinc-500">2 hrs ago</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-lg font-bold text-white mb-2">Morning 5K Run</div>
              <div className="flex gap-4 mb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Distance</span>
                  <span className="font-semibold text-white">5.2 km</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Duration</span>
                  <span className="font-semibold text-white">32 min</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Energy</span>
                  <span className="font-semibold text-white">412 kcal</span>
                </div>
              </div>
              <div className="h-24 bg-zinc-800/50 rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden">
                <Map className="w-8 h-8 text-zinc-700 absolute opacity-20" />
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-emerald-500 fill-none stroke-2 stroke-linecap-round stroke-linejoin-round relative z-10 px-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                  <path d="M 0 30 Q 10 30, 20 20 T 40 15 T 60 25 T 80 10 T 100 15" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-4 text-zinc-400">
              <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                <Heart className="w-5 h-5 fill-rose-500/20 text-rose-500" />
                <span className="text-sm font-medium">12</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">3</span>
              </button>
            </div>
          </div>

          {/* 2. Stake Update Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Stake Update</div>
                <div className="text-xs text-zinc-500">4 hrs ago</div>
              </div>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed mb-4">
              <span className="font-semibold text-white">Highlife Hustlers</span> pulled ahead by <span className="font-bold text-emerald-400">2,400 steps</span> in your stake vs Iron Brigade. 4 days left!
            </p>
            <button className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl text-sm transition-colors">
              View Stake Details
            </button>
          </div>

          {/* 3. Milestone Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-amber-500/20">
                SJ
              </div>
              <div>
                <div className="text-sm text-zinc-300">
                  <span className="font-semibold text-white">Sarah</span> hit a milestone
                </div>
                <div className="text-xs text-zinc-500">Yesterday</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-amber-400 font-bold">14-Day Streak!</div>
                <div className="text-xs text-zinc-400 mt-0.5">Logged activity for 2 straight weeks.</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-zinc-400">
              <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-sm font-medium">8</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">1</span>
              </button>
            </div>
          </div>

        </div>

        <BottomNav activeTab="feed" />
      </div>
    </MobileFrame>
  );
}
