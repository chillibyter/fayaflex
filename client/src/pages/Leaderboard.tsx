import LeaderboardCard from "@/components/LeaderboardCard";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  name: string;
  teamName?: string;
  calories: number;
  goalPercentage: number;
  userId?: string;
  teamId?: string;
};

export default function Leaderboard() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = format(new Date(currentYear, currentMonth - 1), "MMMM yyyy");

  const { 
    data: teamLeaderboard = [], 
    isLoading: isLoadingTeams,
    isError: isErrorTeams,
    refetch: refetchTeams 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/teams', { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/teams?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you and your team rank this month.
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2" data-testid="badge-current-month">
          {monthName}
        </Badge>
      </div>

      {/* Team leaderboard only - Personal leaderboard hidden as per requirements */}
      <div className="space-y-4">
        {isErrorTeams ? (
          <div className="text-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-muted-foreground">Failed to load team leaderboard</p>
            <Button onClick={() => refetchTeams()} variant="outline" data-testid="button-retry-teams">
              Try Again
            </Button>
          </div>
        ) : isLoadingTeams ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : teamLeaderboard.length > 0 ? (
          teamLeaderboard.map((entry) => (
            <LeaderboardCard key={entry.rank} {...entry} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No team rankings yet. Teams need to log activities to appear on the leaderboard!
          </div>
        )}
      </div>
    </div>
  );
}
