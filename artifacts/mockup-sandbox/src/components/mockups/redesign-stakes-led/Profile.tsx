import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import "./_group.css";
import { Plus, Watch, Target, CalendarDays, Flame, Trophy } from "lucide-react";

export function Profile() {
  return (
    <MobileFrame title="Profile" showRightIcons={true}>
      <div className="flex flex-col h-full relative">
        <div className="p-4 pb-24 space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-emerald-500 flex items-center justify-center text-2xl font-bold">
              JD
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">John Doe</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider">HH</span>
                <span className="text-sm font-medium text-zinc-400">Highlife Hustlers</span>
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-zinc-200">12 Day Streak</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-zinc-200">Lvl 8</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Action */}
          <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-5 h-5" /> Log a Workout
          </button>
          
          {/* Sections */}
          <div className="space-y-4">
            {/* My Tracking Section (Dominant) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold">My Tracking</h3>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-6">
                {['M','T','W','T','F','S','S'].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500">{day}</span>
                    <div className="w-full aspect-square rounded-full border-[3px] border-zinc-800 flex items-center justify-center">
                      <div className={`w-3/4 h-3/4 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-xl font-bold text-emerald-400">4</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Workouts</span>
                </div>
                <div className="w-px bg-zinc-800"></div>
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-xl font-bold text-emerald-400">28.5k</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Steps</span>
                </div>
                <div className="w-px bg-zinc-800"></div>
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-xl font-bold text-emerald-400">3.2k</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cals</span>
                </div>
              </div>
            </div>
            
            {/* Devices */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Watch className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-200">Apple Health</div>
                  <div className="text-xs text-emerald-500 font-semibold mt-0.5">Connected · Syncing</div>
                </div>
              </div>
              <button className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">
                Manage
              </button>
            </div>
            
            {/* Goals */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-200">Personal Goals</div>
                  <div className="text-xs text-zinc-500 font-semibold mt-0.5">10k steps / day</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav activeTab="profile" />
    </MobileFrame>
  );
}
