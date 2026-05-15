import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import "./_group.css";
import { ChevronDown, ArrowUp, ArrowDown, Minus } from "lucide-react";

export function Leaderboard() {
  const teams = [
    { rank: 1, name: "Iron Brigade", score: "245k", delta: 0, initials: "IB", color: "bg-blue-600" },
    { rank: 2, name: "Highlife Hustlers", score: "210k", delta: 1, initials: "HH", color: "bg-emerald-600", isCurrentUser: true },
    { rank: 3, name: "Squad Sweat", score: "198k", delta: -1, initials: "SS", color: "bg-rose-600" },
    { rank: 4, name: "Cardio Kings", score: "185k", delta: 2, initials: "CK", color: "bg-purple-600" },
    { rank: 5, name: "The Pace Makers", score: "172k", delta: -1, initials: "PM", color: "bg-amber-600" },
    { rank: 6, name: "Distance Demons", score: "165k", delta: 0, initials: "DD", color: "bg-cyan-600" },
    { rank: 7, name: "Weekend Warriors", score: "142k", delta: 0, initials: "WW", color: "bg-orange-600" },
  ];

  return (
    <MobileFrame title="Leaderboard">
      <div className="flex flex-col h-full relative">
        <div className="px-4 py-3 bg-zinc-950/95 sticky top-0 z-30 border-b border-zinc-900">
          <div className="flex items-center justify-between mb-4 pt-2">
            <button className="flex items-center gap-1.5 text-lg font-bold">
              May 2026 <ChevronDown className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
          
          <div className="bg-zinc-900 p-1 rounded-xl flex text-sm font-semibold">
            <button className="flex-1 py-1.5 rounded-lg text-zinc-400">Individuals</button>
            <button className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-100 shadow">Teams</button>
          </div>
        </div>
        
        <div className="flex-1 p-4 pb-24 space-y-2">
          {teams.map((team) => (
            <div key={team.rank} className={`flex items-center gap-3 p-3 rounded-xl border ${team.isCurrentUser ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-zinc-900 border-transparent'}`}>
              <div className="w-6 text-center font-bold text-zinc-500">{team.rank}</div>
              
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white ${team.color}`}>
                {team.initials}
              </div>
              
              <div className="flex-1 font-semibold">{team.name}</div>
              
              <div className="flex items-center gap-3">
                <div className="font-bold tabular-nums">{team.score}</div>
                <div className="w-4 flex justify-center">
                  {team.delta > 0 && <ArrowUp className="w-4 h-4 text-emerald-500" />}
                  {team.delta < 0 && <ArrowDown className="w-4 h-4 text-rose-500" />}
                  {team.delta === 0 && <Minus className="w-4 h-4 text-zinc-600" />}
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-6 pb-6 text-center">
            <button className="text-sm font-semibold text-emerald-500">See all 42 teams</button>
          </div>
        </div>
      </div>
      <BottomNav activeTab="leaderboard" />
    </MobileFrame>
  );
}
