import { Flame, Heart, Trophy, ChevronLeft, MoreVertical, Home, Users, Activity, Bell, User } from "lucide-react";

const members = [
  { name: "You",      avatar: "Y", steps: 30800, pct: 88, status: "behind" },
  { name: "Amara",    avatar: "A", steps: 35400, pct: 100, status: "cleared" },
  { name: "Marcus",   avatar: "M", steps: 21300, pct: 61, status: "behind" },
  { name: "Priya",    avatar: "P", steps: 35100, pct: 100, status: "cleared" },
  { name: "Jordan",   avatar: "J", steps: 33900, pct: 97, status: "ontrack" },
];

const GOAL = 35000;

function StatusDot({ status }: { status: string }) {
  const color =
    status === "cleared" ? "bg-emerald-500" :
    status === "ontrack" ? "bg-amber-400" :
    "bg-rose-500";
  return <span className={`inline-block w-2 h-2 rounded-sm ${color}`} />;
}

export function ActiveStake() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-['Inter'] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <ChevronLeft className="w-5 h-5 text-zinc-400" />
        <div className="text-sm font-semibold tracking-wide text-zinc-300">TEAM STAKES</div>
        <MoreVertical className="w-5 h-5 text-zinc-400" />
      </div>

      <div className="px-4 pb-24 space-y-4">
        <div className="relative rounded-md overflow-hidden bg-gradient-to-br from-orange-600 via-rose-600 to-rose-700 p-5">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,200,100,0.6), transparent 50%)"
          }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-wider opacity-90">FLAMESQUAD · WEEK 18</span>
            </div>
            <div className="text-2xl font-bold leading-tight">35,000 steps each<br />by Sunday 11:59pm</div>
            <div className="mt-4 flex items-baseline gap-2">
              <div className="text-4xl font-bold tabular-nums">3d</div>
              <div className="text-xl font-semibold tabular-nums opacity-90">14h 22m</div>
              <div className="text-xs uppercase tracking-wider opacity-75 ml-auto">left</div>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-rose-500/10 p-2">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-0.5">If team clears the stake</div>
              <div className="text-base font-semibold">$50 unlocks for St. Jude</div>
              <div className="text-xs text-zinc-400 mt-1">Sponsored by Acme Fitness · Auto-donated Sunday</div>
            </div>
          </div>
          <div className="h-px bg-zinc-800 my-3" />
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-amber-500/10 p-2">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-0.5">If anyone falls short</div>
              <div className="text-base font-semibold">They post a 30-sec workout video</div>
              <div className="text-xs text-zinc-400 mt-1">Goes to the team feed · No money lost</div>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="text-sm font-semibold">Team Progress</div>
            <div className="text-xs text-zinc-500">2 of 5 cleared</div>
          </div>
          <div className="px-4 pb-3 space-y-3">
            {members.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${m.name === "You" ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{m.name}</span>
                      <StatusDot status={m.status} />
                    </div>
                    <div className="text-xs tabular-nums text-zinc-400">
                      {(m.steps / 1000).toFixed(1)}k <span className="text-zinc-600">/ 35k</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-sm overflow-hidden">
                    <div
                      className={`h-full ${m.status === "cleared" ? "bg-emerald-500" : m.status === "ontrack" ? "bg-amber-400" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(100, m.pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-rose-500/10 border-t border-rose-500/20 px-4 py-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-xs text-rose-200 leading-snug">
              <span className="font-semibold">You're 4,200 behind pace.</span> A 35-min walk tonight gets you back on track.
            </div>
          </div>
        </div>

        <div className="rounded-md bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="text-sm font-semibold">FlameSquad Streak</div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold tabular-nums">6</div>
            <div className="text-sm text-zinc-400">stakes cleared in a row</div>
          </div>
          <div className="text-xs text-zinc-500 mt-1">Break the streak and the team multiplier resets to 1×.</div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-2 py-2 flex items-center justify-around">
        {[
          { Icon: Home, label: "Home" },
          { Icon: Activity, label: "Activity" },
          { Icon: Users, label: "Teams", active: true },
          { Icon: Bell, label: "Inbox" },
          { Icon: User, label: "Me" },
        ].map(({ Icon, label, active }) => (
          <div key={label} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${active ? "text-orange-400" : "text-zinc-500"}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
