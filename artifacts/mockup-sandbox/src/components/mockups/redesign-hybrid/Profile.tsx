import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import { Settings, Edit3, Flame, Trophy, Plus, MessageSquare, Activity, Watch, Target, ChevronRight } from "lucide-react";

export function Profile() {
  return (
    <MobileFrame>
      <div className="flex-1 bg-zinc-950 flex flex-col relative h-full">
        {/* Header */}
        <div className="pt-12 pb-4 px-4 bg-zinc-950 z-10 shrink-0 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button className="text-zinc-400"><Settings className="w-6 h-6" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-6 pt-2">
          
          {/* User Header */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-800" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-zinc-950 text-white font-bold text-[10px]">
                LV9
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold">Felix</h2>
                <button className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-800">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm font-medium text-emerald-400 mb-2">Highlife Hustlers</div>
              <div className="flex items-center gap-3 text-xs font-semibold text-zinc-400">
                <div className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-500" /> 14 day streak</div>
                <div className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-zinc-300" /> 4 wins</div>
              </div>
            </div>
          </div>
          
          {/* 1. My Tracking */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">My Tracking</h3>
              <button className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                <Plus className="w-3 h-3" /> Log Workout
              </button>
            </div>
            
            {/* Weekly Calendar */}
            <div className="flex justify-between mb-6">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500">{day}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center relative">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-zinc-800" />
                      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray="88" strokeDashoffset={i < 4 ? "0" : i === 4 ? "20" : "88"} className={i < 4 ? "text-emerald-500" : i === 4 ? "text-amber-400" : "text-zinc-800"} strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 7 Day Summary */}
            <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800/50 flex divide-x divide-zinc-800">
               <div className="flex-1 px-2 flex flex-col items-center">
                 <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Steps</div>
                 <div className="font-bold text-sm">62.4k</div>
               </div>
               <div className="flex-1 px-2 flex flex-col items-center">
                 <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Active</div>
                 <div className="font-bold text-sm">4h 20m</div>
               </div>
               <div className="flex-1 px-2 flex flex-col items-center">
                 <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Kcal</div>
                 <div className="font-bold text-sm">3,420</div>
               </div>
            </div>
          </div>
          
          {/* 2. Smart Goals */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
             <div className="flex items-center gap-2 mb-4 text-white font-bold">
               <Target className="w-4 h-4 text-emerald-500" /> Smart Goals
             </div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs font-semibold mb-1">
                   <span>Run 15 miles this week</span>
                   <span className="text-zinc-400">8 / 15mi</span>
                 </div>
                 <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[53%]" />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs font-semibold mb-1">
                   <span>Log 4 strength sessions</span>
                   <span className="text-zinc-400">2 / 4</span>
                 </div>
                 <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-[50%]" />
                 </div>
               </div>
             </div>
          </div>
          
          {/* 3. AI Coach */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-zinc-900 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Faya AI Coach</div>
                <div className="text-xs text-zinc-400">Ask about your routine</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500" />
          </div>
          
          {/* 4. Personal Stats (Chart Placeholder) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4 text-white font-bold">
              <Activity className="w-4 h-4 text-emerald-500" /> Monthly Progress
            </div>
            <div className="h-32 bg-zinc-950 rounded-xl border border-zinc-800/50 flex items-end px-2 pt-4 pb-2 gap-1.5">
              {[40, 60, 45, 80, 55, 90, 70, 85, 65, 50, 75, 40, 60, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-emerald-500/80 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          
          {/* 5. Devices */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4 text-white font-bold">
              <Watch className="w-4 h-4 text-emerald-500" /> Connected Devices
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Apple Health
              </div>
              <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 flex items-center gap-2">
                Garmin
              </div>
              <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 flex items-center gap-2">
                Health Connect
              </div>
            </div>
          </div>

        </div>
        
        <BottomNav activeTab="profile" />
      </div>
    </MobileFrame>
  );
}