import LeaderboardCard from "@/components/LeaderboardCard";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

      {/* Formula explanation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-sm">Team Ranking Formula</h3>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Teams are ranked by average daily calories burned per user:</p>
                <div className="font-mono text-xs bg-background/50 p-3 rounded-md border">
                  <div className="text-center">
                    <div className="font-semibold mb-1">Average Daily Calories per User =</div>
                    <div className="border-t border-border my-2"></div>
                    <div>
                      <span className="text-primary font-semibold">Total Team Calories</span>
                      <div className="my-1">÷</div>
                      <span className="text-primary font-semibold">(Number of Team Members × Days in Month)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
