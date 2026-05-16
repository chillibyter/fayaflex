import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Target, Trophy, ChevronRight, Plus } from "lucide-react";
import ForYou from "@/pages/ForYou";
import type { Team, Stake, Activity } from "@shared/schema";

type DashboardStats = {
  calories?: number;
  steps?: number;
  workouts?: number;
};

type ActiveStakeResponse = {
  stake: Stake;
  individualScores: Array<{ userId: string; teamId: string; score: number }>;
  teamTotals: Record<string, number>;
} | null;

type TeamWithMembers = Team & { memberCount?: number };

type TeamRank = { rank: number; total: number };

/**
 * Pulse strip — a sticky, single-glance header showing:
 *  • the user's primary team rank in the global teams leaderboard
 *  • the most relevant active stake (if any)
 *  • today's active-calorie ring vs the user's daily goal
 *
 * Sits above the existing For-You feed so opening the app collapses the
 * "where do I stand right now" question into one screen.
 */
function PulseStrip() {
  const { data: teams } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/teams"],
  });
  const primaryTeam = teams && teams.length > 0 ? teams[0] : null;

  const { data: teamRank } = useQuery<TeamRank>({
    queryKey: ["/api/leaderboard/teams/rank", primaryTeam?.id],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard/teams", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load team leaderboard");
      // Leaderboard rows expose `teamId` (not `id`) — see /api/leaderboard/teams shape.
      const board: Array<{ teamId: string; rank?: number }> = await res.json();
      const row = primaryTeam ? board.find(t => t.teamId === primaryTeam.id) : undefined;
      return { rank: row?.rank ?? 0, total: board.length };
    },
    enabled: !!primaryTeam,
  });

  // Today's calories — compute from /api/activities (dashboard/stats returns monthly).
  // De-duplicates by source by taking the max calories per row for today.
  const { data: todayActivities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: activeStake } = useQuery<ActiveStakeResponse>({
    queryKey: ["/api/stakes/active"],
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCal = todayActivities
    .filter(a => a.date === todayStr)
    .reduce((max, a) => Math.max(max, a.calories || 0), 0);
  const dailyGoal = 600; // Steady daily target until per-user goals plumb through
  const pct = Math.min(100, Math.round((todayCal / dailyGoal) * 100));

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="px-4 py-3 space-y-3 max-w-screen-lg mx-auto">
        {/* Top row: team rank + today calorie ring */}
        <div className="flex items-center gap-3">
          <Link href="/leaderboard" className="flex-1">
            <Card className="p-3 hover-elevate cursor-pointer" data-testid="card-pulse-team-rank">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Team rank</p>
                  {primaryTeam ? (
                    <p className="text-sm font-semibold truncate" data-testid="text-pulse-team-name">
                      {primaryTeam.name}{" "}
                      <span className="text-muted-foreground font-normal">
                        {teamRank && teamRank.rank > 0 ? `#${teamRank.rank}` : "—"}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-muted-foreground">Join a team</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>

          {/* Calorie ring */}
          <Link href="/dashboard">
            <div className="relative flex items-center justify-center" data-testid="ring-pulse-calories">
              <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                <circle cx="28" cy="28" r="24" className="fill-none stroke-muted" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="24"
                  className="fill-none stroke-primary transition-all"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 150.8} 150.8`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Flame className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold leading-none">{todayCal}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Active stake row */}
        {activeStake ? (
          <Link href={`/stakes/${activeStake.stake.id}`}>
            <Card className="p-3 hover-elevate cursor-pointer" data-testid="card-pulse-active-stake">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">Active stake</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      ends {new Date(activeStake.stake.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold truncate mt-0.5" data-testid="text-pulse-stake-title">
                    {activeStake.stake.title}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        ) : (
          <Link href="/stakes">
            <Card className="p-3 hover-elevate cursor-pointer border-dashed" data-testid="card-pulse-no-stake">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Start a stake</p>
                  <p className="text-[11px] text-muted-foreground">Challenge your team or another team</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}

function PulseStripSkeleton() {
  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 flex-1 rounded-md" />
          <Skeleton className="h-14 w-14 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <PulseStrip />
      {/* Team feed lives directly under the pulse strip */}
      <ForYou />
    </div>
  );
}

// Re-exported only to keep the skeleton tree-shake friendly if reused later.
export { PulseStripSkeleton };
