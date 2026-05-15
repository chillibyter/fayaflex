import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import { Flame, Settings, Activity, ShieldCheck, Watch, LogOut, ChevronRight } from "lucide-react";

export function Profile() {
  return (
    <MobileFrame>
      <div className="flex-1 bg-zinc-950 flex flex-col relative overflow-y-auto pb-28 hide-scrollbar">
        
        {/* Header / Top */}
        <div className="pt-6 px-4 pb-4 flex justify-between items-start">
          <div className="w-6" />
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full border-2 border-emerald-500 p-1 mb-3">
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-2xl font-bold text-white">MK</span>
              </div>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Marcus King</h1>
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
              Highlife Hustlers
            </div>
          </div>
          <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex px-4 gap-3 mb-6">
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <div className="flex justify-center items-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-white mb-0.5">14</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Day Streak</div>
          </div>
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <div className="text-xs font-bold text-emerald-400 mb-1">Level 24</div>
            <div className="text-xl font-bold text-white mb-0.5">8.4k</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">XP Earned</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-2 flex gap-6 border-b border-zinc-800 mb-4 sticky top-0 bg-zinc-950/80 backdrop-blur z-20">
          <button className="text-sm font-semibold text-white border-b-2 border-emerald-500 pb-2">Tracking</button>
          <button className="text-sm font-medium text-zinc-500 pb-2">Devices</button>
          <button className="text-sm font-medium text-zinc-500 pb-2">Goals</button>
        </div>

        {/* Tracking Section (Dominant) */}
        <div className="px-4 space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-3">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Log a Workout</h3>
            <p className="text-sm text-zinc-400 mb-4">Manually enter your steps or activity to update the feed and leaderboards.</p>
            <button className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl">
              Add Activity
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h3 className="font-semibold text-white mb-4">This Week</h3>
            <div className="flex justify-between items-end h-24 mb-2 px-2">
              {/* Bar chart mock */}
              {[40, 70, 30, 85, 50, 0, 0].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-6 bg-zinc-800 rounded-sm relative flex items-end justify-center h-full">
                    {h > 0 && (
                      <div 
                        className={`w-full rounded-sm ${i === 3 ? "bg-emerald-500" : "bg-emerald-500/40"}`} 
                        style={{ height: `${h}%` }}
                      ></div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {['M','T','W','T','F','S','S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
             <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Watch className="w-5 h-5 text-zinc-400" />
                   <div className="font-semibold text-white text-sm">Apple Health</div>
                </div>
                <div className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Connected</div>
             </div>
             <button className="w-full p-4 flex items-center justify-between text-zinc-400 hover:bg-zinc-800/50 transition-colors text-sm">
                <span>Manage connected devices</span>
                <ChevronRight className="w-4 h-4" />
             </button>
          </div>
          
          <button className="w-full py-4 text-rose-500 text-sm font-semibold flex items-center justify-center gap-2">
             <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <BottomNav activeTab="profile" />
      </div>
    </MobileFrame>
  );
}
