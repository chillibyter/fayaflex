import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { Link } from "wouter";

export interface TeamLeaderboardEntry {
  rank: number;
  name: string;
  teamId?: string;
  memberCount?: number;
  calories: number;
  daysElapsed?: number;
  unit?: string;
  trend?: "up" | "down" | "flat" | null;
  caloriesToOvertake?: number;
}

function getMedalIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return null;
}

function TrendBadge({ trend }: { trend: "up" | "down" | "flat" | null | undefined }) {
  if (!trend) return null;
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400" data-testid="badge-trend-up">
        <TrendingUp className="h-3 w-3" />
        Trending up
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400" data-testid="badge-trend-down">
        <TrendingDown className="h-3 w-3" />
        Trending down
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground" data-testid="badge-trend-flat">
      <Minus className="h-3 w-3" />
      Steady
    </span>
  );
}

export default function TeamLeaderboardCard({
  rank,
  name,
  teamId,
  memberCount,
  calories,
  daysElapsed,
  unit = "cal/day per member",
  trend,
  caloriesToOvertake,
}: TeamLeaderboardEntry) {
  const content = (
    <div className="flex items-center gap-3 sm:gap-4">
      <Badge
        variant={rank <= 3 ? "default" : "secondary"}
        className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-semibold"
      >
        {rank}
      </Badge>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="font-semibold truncate text-sm sm:text-base" data-testid={`text-team-name-${rank}`}>
            {name}
          </h4>
          {getMedalIcon(rank)}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {typeof memberCount === "number" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          )}
          <TrendBadge trend={trend} />
        </div>
        {rank > 1 && caloriesToOvertake && caloriesToOvertake > 0 && (
          <p className="text-xs text-muted-foreground mt-1" data-testid={`text-overtake-${rank}`}>
            +{caloriesToOvertake.toLocaleString()} {unit.split(" ")[0]} to overtake #{rank - 1}
          </p>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-xl sm:text-2xl font-bold leading-tight" data-testid={`text-team-score-${rank}`}>
          {calories.toLocaleString()}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{unit}</p>
        {typeof daysElapsed === "number" && daysElapsed > 0 && (
          <p className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5">
            over {daysElapsed} {daysElapsed === 1 ? "day" : "days"}
          </p>
        )}
      </div>
    </div>
  );

  if (teamId) {
    return (
      <Link href={`/teams/${teamId}/leaderboard`}>
        <Card className="p-3 sm:p-4 hover-elevate cursor-pointer" data-testid={`card-team-${rank}`}>
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="p-3 sm:p-4" data-testid={`card-team-${rank}`}>
      {content}
    </Card>
  );
}
