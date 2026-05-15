import { MobileFrame } from "./_shared/MobileFrame";
import { BottomNav } from "./_shared/BottomNav";
import { ChevronDown, ChevronUp, Minus } from "lucide-react";

export function Leaderboard() {
  const teams = [
    { rank: 1, name: "Squad Sweat", points: "142,500", delta: "up", avatar: "SS" },
    { rank: 2, name: "Highlife Hustlers", points: "138,200", delta: "up", avatar: "HH", isUser: true },
    { rank: 3, name: "Iron Brigade", points: "135,900", delta: "down", avatar: "IB" },
    { rank: 4, name: "Cardio Kings", points: "129,400", delta: "same", avatar: "CK" },
    { rank: 5, name: "Pace Makers", points: "118,100", delta: "down", avatar: "PM" },
    { rank: 6, name: "The Sprinters", points: "112,000", delta: "up", avatar: "TS" },
    { rank: 7, name: "Peak Performers", points: "105,300", delta: "down", avatar: "PP" },
  ];

  return (
    <MobileFrame>
      <div className="flex-1 bg-zinc-950 flex flex-col relative">
        <div className="h-14 pt-2 px-4 flex items-center justify-between z-10 bg-zinc-950">
          <div className="font-bold text-xl text-white">Leaderboard</div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-full text-sm font-medium text-zinc-300">
            May 2026 <ChevronDown className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Segmented Control */}
        <div className="px-4 py-3 bg-zinc-950">
          <div className="bg-zinc-900 p-1 rounded-xl flex">
            <button className="flex-1 py-1.5 text-sm font-medium text-zinc-400 rounded-lg">Individuals</button>
            <button className="flex-1 py-1.5 text-sm font-medium bg-zinc-800 text-white rounded-lg shadow-sm">Teams</button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-28 px-4 space-y-2 hide-scrollbar">
          {teams.map((team) => (
            <div 
              key={team.rank} 
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                team.isUser 
                  ? "bg-emerald-950/30 border-emerald-900/50" 
                  : "bg-zinc-900 border-zinc-800/50"
              }`}
            >
              <div className="w-6 text-center text-sm font-bold text-zinc-500">
                {team.rank}
              </div>
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                team.rank === 1 ? "bg-amber-500 shadow-lg shadow-amber-500/20" :
                team.rank === 2 ? "bg-zinc-400" :
                team.rank === 3 ? "bg-amber-700" :
                "bg-zinc-800"
              }`}>
                {team.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${team.isUser ? "text-emerald-400" : "text-zinc-100"}`}>
                  {team.name}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {team.points} pts
                </div>
              </div>

              <div className="flex items-center justify-center w-8">
                {team.delta === 'up' && <ChevronUp className="w-5 h-5 text-emerald-500" />}
                {team.delta === 'down' && <ChevronDown className="w-5 h-5 text-rose-500" />}
                {team.delta === 'same' && <Minus className="w-4 h-4 text-zinc-600" />}
              </div>
            </div>
          ))}

          <div className="py-6 text-center">
            <button className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors">
              See all 142 teams
            </button>
          </div>
        </div>

        <BottomNav activeTab="leaderboard" />
      </div>
    </MobileFrame>
  );
}
