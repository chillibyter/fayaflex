import { ChevronLeft, Footprints, Dumbbell, Flame, Heart, Pizza, Trophy, Calendar, Users, Info } from "lucide-react";

function Pill({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex-1 text-center py-2.5 rounded-md text-sm font-semibold ${
      active ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"
    }`}>
      {children}
    </div>
  );
}

function GoalCard({ Icon, label, target, unit, active }: { Icon: any; label: string; target: string; unit: string; active?: boolean }) {
  return (
    <div className={`rounded-md p-3 border ${active ? "bg-orange-500/10 border-orange-500/40" : "bg-zinc-900 border-zinc-800"}`}>
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${active ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-zinc-500 mt-0.5"><span className="tabular-nums">{target}</span> {unit}</div>
    </div>
  );
}

function StakeOption({ Icon, title, subtitle, badge, badgeColor, active }: { Icon: any; title: string; subtitle: string; badge?: string; badgeColor?: string; active?: boolean }) {
  return (
    <div className={`rounded-md p-3 border flex items-center gap-3 ${active ? "bg-rose-500/10 border-rose-500/40" : "bg-zinc-900 border-zinc-800"}`}>
      <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${active ? "bg-rose-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {badge && <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${badgeColor}`}>{badge}</span>}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5 leading-snug">{subtitle}</div>
      </div>
      <div className={`w-4 h-4 rounded-sm border-2 ${active ? "bg-rose-500 border-rose-500" : "border-zinc-700"}`} />
    </div>
  );
}

export function CreateStake() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-['Inter'] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <ChevronLeft className="w-5 h-5 text-zinc-400" />
        <div className="text-sm font-semibold tracking-wide text-zinc-300">START A STAKE</div>
        <div className="w-5" />
      </div>

      <div className="px-4 pb-32 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Team</div>
          </div>
          <div className="rounded-md bg-zinc-900 border border-zinc-800 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-bold">
              FS
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">FlameSquad</div>
              <div className="text-xs text-zinc-500">5 members · all opted in</div>
            </div>
            <button className="text-xs text-orange-400 font-semibold">Change</button>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">Goal type</div>
          <div className="grid grid-cols-3 gap-2">
            <GoalCard Icon={Footprints} label="Steps" target="35,000" unit="per person" active />
            <GoalCard Icon={Dumbbell} label="Workouts" target="4" unit="per person" />
            <GoalCard Icon={Flame} label="Calories" target="3,500" unit="per person" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Target per person</div>
            <div className="text-sm font-bold text-orange-400 tabular-nums">35,000 steps</div>
          </div>
          <div className="rounded-md bg-zinc-900 border border-zinc-800 p-4">
            <div className="relative h-1.5 bg-zinc-800 rounded-sm">
              <div className="absolute inset-y-0 left-0 bg-orange-500 rounded-sm" style={{ width: "55%" }} />
              <div className="absolute -top-1.5 w-4 h-4 rounded-full bg-orange-500 border-2 border-zinc-950" style={{ left: "calc(55% - 8px)" }} />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-600 mt-2 tabular-nums">
              <span>10k</span><span>25k</span><span>50k</span><span>75k</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Duration</div>
          </div>
          <div className="flex gap-2">
            <Pill>3 days</Pill>
            <Pill active>1 week</Pill>
            <Pill>2 weeks</Pill>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">What's at stake</div>
          <div className="space-y-2">
            <StakeOption Icon={Heart} title="Charity pool" subtitle="$50 to a cause your team picks. Funded by sponsor — no member money." badge="Recommended" badgeColor="bg-emerald-500/20 text-emerald-300" active />
            <StakeOption Icon={Pizza} title="Loser pays for it" subtitle="Anyone who falls short does the forfeit. Default: post a 30-sec workout video." />
            <StakeOption Icon={Trophy} title="Bragging rights only" subtitle="No charity, no forfeit. Just the streak and team multiplier." />
          </div>
        </div>

        <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3 flex gap-2">
          <Info className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-100 leading-snug">
            FayaFlex never collects or holds member money. Charity stakes are funded by sponsors or your organization.
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-4 py-3 pb-6">
        <button className="w-full bg-orange-500 text-white font-semibold py-3 rounded-md text-base">
          Start FlameSquad's Stake
        </button>
        <div className="text-center text-[11px] text-zinc-500 mt-2">All 5 members will get a notification to confirm.</div>
      </div>
    </div>
  );
}
