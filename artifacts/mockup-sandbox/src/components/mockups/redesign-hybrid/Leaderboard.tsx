import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import { ChevronDown, Trophy, ArrowUp, ArrowDown, Minus } from "lucide-react";

const DATA = [
  { rank: 1, name: "Iron Brigade", score: "245k", delta: 0, initials: "IB", color: "bg-zinc-700 text-zinc-300" },
  { rank: 2, name: "Highlife Hustlers", score: "242k", delta: 1, initials: "HH", color: "bg-emerald-500 text-white", isMe: true },
  { rank: 3, name: "Cardio Kings", score: "210k", delta: -1, initials: "CK", color: "bg-blue-500 text-white" },
  { rank: 4, name: "Sweat Squad", score: "198k", delta: 2, initials: "SS", color: "bg-amber-500 text-white" },
  { rank: 5, name: "Weekend Warriors", score: "185k", delta: 0, initials: "WW", color: "bg-purple-500 text-white" },
  { rank: 6, name: "Pace Makers", score: "160k", delta: -1, initials: "PM", color: "bg-rose-500 text-white" },
  { rank: 7, name: "Trail Blazers", score: "155k", delta: -2, initials: "TB", color: "bg-cyan-500 text-white" },
];

export function Leaderboard() {
  return (
    <MobileFrame>
      <div className="flex-1 bg-zinc-950 flex flex-col relative h-full">
        {/* Header */}
        <div className="pt-12 pb-4 px-4 bg-zinc-950 z-10 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <button className="flex items-center gap-1.5 text-sm font-semibold bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
              May 2026 <ChevronDown className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-zinc-900 p-1 rounded-xl">
            <button className="flex-1 py-1.5 text-sm font-semibold text-zinc-400 rounded-lg">Individuals</button>
            <button className="flex-1 py-1.5 text-sm font-semibold bg-zinc-800 text-white rounded-lg shadow-sm">Teams</button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-2">
          {DATA.map((t, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${t.isMe ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-zinc-900/50 border-zinc-800/50'}`}>
              <div className="w-6 text-center font-bold text-zinc-500 tabular-nums">{t.rank}</div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${t.color}`}>
                {t.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate ${t.isMe ? 'text-emerald-400' : 'text-white'}`}>{t.name}</div>
                <div className="text-xs text-zinc-500 font-medium">{t.score} steps</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="w-6 h-6 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800">
                  {t.delta > 0 ? <ArrowUp className="w-3.5 h-3.5 text-emerald-500" /> :
                   t.delta < 0 ? <ArrowDown className="w-3.5 h-3.5 text-rose-500" /> :
                   <Minus className="w-3.5 h-3.5 text-zinc-600" />}
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-4 text-center">
            <button className="text-sm font-semibold text-zinc-500 hover:text-white transition-colors">
              See all 42 teams
            </button>
          </div>
        </div>
        
        <BottomNav activeTab="leaderboard" />
      </div>
    </MobileFrame>
  );
}