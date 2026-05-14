import { Trophy, Heart, Flame, Share2, ChevronRight, Sparkles, Home, Users, Activity, Bell, User } from "lucide-react";

const members = [
  { name: "You",    avatar: "Y", steps: 36100, cleared: true },
  { name: "Amara",  avatar: "A", steps: 41300, cleared: true },
  { name: "Marcus", avatar: "M", steps: 28900, cleared: false },
  { name: "Priya",  avatar: "P", steps: 38200, cleared: true },
  { name: "Jordan", avatar: "J", steps: 35400, cleared: true },
];

export function StakeResult() {
  const cleared = members.filter(m => m.cleared).length;
  const total = members.length;
  const teamCleared = cleared >= 4;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-['Inter'] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div className="text-xs text-zinc-500 font-semibold tracking-wide">WEEK 18 RESULTS</div>
        <Share2 className="w-5 h-5 text-zinc-400" />
      </div>

      <div className="px-4 pb-24 space-y-4">
        <div className="relative rounded-md overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-center">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "radial-gradient(circle at 50% 0%, rgba(150,255,200,0.4), transparent 60%)"
          }} />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 backdrop-blur mb-3">
              <Trophy className="w-7 h-7 text-amber-300" />
            </div>
            <div className="text-xs font-bold tracking-widest uppercase opacity-80 mb-1">Stake Cleared</div>
            <div className="text-3xl font-bold leading-tight">FlameSquad got it<br />done.</div>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-md px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-sm font-semibold tabular-nums">{cleared} of {total} hit goal</span>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-rose-500/10 p-2">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-0.5">Stake unlocked</div>
              <div className="text-base font-semibold">$50 donated to St. Jude</div>
              <div className="text-xs text-zinc-400 mt-1">Funded by Acme Fitness · Receipt sent to team chat</div>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-4 pt-4 pb-2 text-sm font-semibold">Member outcomes</div>
          <div className="px-4 pb-3 space-y-2.5">
            {members.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${m.name === "You" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                  {m.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-xs text-zinc-500 tabular-nums">{m.steps.toLocaleString()} steps</div>
                </div>
                {m.cleared ? (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-emerald-500/15 text-emerald-300">Cleared</span>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-rose-500/15 text-rose-300">Forfeit</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-amber-400" />
            <div className="text-xs uppercase tracking-wider font-bold text-amber-300">Marcus owes the team</div>
          </div>
          <div className="text-sm text-amber-100 leading-snug">
            One 30-second workout video posted to the team feed before the next stake starts.
          </div>
        </div>

        <div className="rounded-md bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1">Team streak</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold tabular-nums text-emerald-400">7</div>
                <div className="text-sm text-zinc-400">stakes in a row</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1">Multiplier</div>
              <div className="text-3xl font-bold tabular-nums text-emerald-400">3×</div>
            </div>
          </div>
        </div>

        <button className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-md flex items-center justify-center gap-2">
          Start next week's stake
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-2 py-2 flex items-center justify-around">
        {[
          { Icon: Home, label: "Home" },
          { Icon: Activity, label: "Activity" },
          { Icon: Users, label: "Teams", active: true },
          { Icon: Bell, label: "Inbox" },
          { Icon: User, label: "Me" },
        ].map(({ Icon, label, active }) => (
          <div key={label} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${active ? "text-emerald-400" : "text-zinc-500"}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
